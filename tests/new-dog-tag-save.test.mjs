import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function setup(failPhoto = false) {
  const source = readFileSync(new URL('../app/admin/dogs/new/actions.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('actions.ts', source, ts.ScriptTarget.Latest, true);
  const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'createDogListingAction');
  const js = ts.transpileModule(node.getText(ast).replace('export async', 'async'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const saved = { dogs: [], tags: [] };
  const pairs = [{ traitType: 'personality', traitValue: 'Playful' }, { traitType: 'protectiveness', traitValue: 'Very chill - not reactive' }];
  const client = { from(table) { return { insert(rows) {
    if (table === 'dogs') { saved.dogs.push(rows); return { select: () => ({ single: async () => ({ data: { id: 'test-dog' }, error: null }) }) }; }
    if (table === 'dog_traits') saved.tags.push(...rows);
    return Promise.resolve({ error: null });
  } }; } };
  const getString = (form, key) => String(form.get(key) ?? '');
  const bindings = {
    getString, getOptionalString: (f,k) => getString(f,k) || null, getOptionalNumber: () => null,
    canonicalizeBreedLabel: v => v, isCanonicalDogBreed: () => true,
    normalizeMediaFiles: () => failPhoto ? [new File(['bad'], 'broken.jpg', { type: 'image/jpeg' })] : [],
    normalizePhotoUrls: () => [], normalizePhotoFiles: () => [], getOptionalVideoFile: () => null,
    getOrderedMediaKeys: () => failPhoto ? ['file-0'] : [], getStringValues: () => [],
    normalizeStructuredTraits: () => pairs, normalizeTraitPairs: () => [],
    isVideoFile: () => false, isHeicFile: () => false,
    requireShelterAccess: async () => ({ userId: 'staff', role: 'shelter_admin' }), createAdminClient: () => client,
    getOptionalBooleanValue: () => null, getBoolean: () => false, getNextDogNumber: async () => 1,
    getEnumValue: (f,k,_allowed,fallback) => getString(f,k) || fallback,
    DOG_ADOPTION_STATUSES: new Set(), DOG_ENERGY_LEVELS: new Set(), DOG_GENDERS: new Set(), DOG_SIZES: new Set(),
    logAdminAuditEvent: async () => {}, revalidatePath: () => {}, redirectAfterShelterDogMutation: async () => {},
    saveDogCarePassportFromForm: async () => {}, Buffer,
    guessExtensionFromFileName: () => '.jpg', extensionFromContentType: () => '.jpg',
    uploadPhotoBuffer: async () => { throw new Error('Simulated photo storage failure'); },
    mediaFailureMessage: (_name, message) => message,
  };
  const action = new Function(...Object.keys(bindings), `${js}; return createDogListingAction;`)(...Object.values(bindings));
  const form = new FormData();
  for (const [key,value] of Object.entries({name:'Test', name_th:'Test', shelter_id:'shelter', breed:'Mixed Breed', gender:'female'})) form.set(key,value);
  return { action, form, saved };
}

test('new profile saves submitted personality and matching tags on the first call', async () => {
  const {action,form,saved} = setup();
  const result = await action({},form);
  assert.equal(result.status,'success');
  assert.equal(saved.dogs.length,1);
  assert.equal(saved.tags.length,2);
});

test('a failed photo must not lose selected tags from the saved draft', async () => {
  const {action,form,saved} = setup(true);
  const result = await action({},form);
  assert.equal(result.status,'error');
  assert.equal(result.dogId,'test-dog');
  assert.equal(saved.tags.length,2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { unzipSync, strFromU8 } from 'fflate';
const nativeRequire = createRequire(import.meta.url);
function load(path, mocks = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module = {exports:{}};
  vm.runInNewContext(code, {module,exports:module.exports,TextEncoder,Uint8Array,Date,URL,Response,Request,ReadableStream,AbortSignal,process:{env:{}},console,...globals,require(name){
    if (name in mocks) return mocks[name];
    if (name==='server-only') return {};
    if (name.startsWith('@/')) return load(name.slice(2)+'.ts',mocks,globals);
    return nativeRequire(name);
  }});
  return module.exports;
}
const payload = {sizes:['Small'],energyLevels:[],fullAnswers:{0:['Small']},goodWithCats:null,goodWithDogs:null,goodWithKids:null};
test('guest filters reuse matching model and reject malformed or oversized cookies',()=>{
 const {readGuestPreferences}=load('utils/guest-preferences.ts');
 assert.equal(readGuestPreferences(JSON.stringify(payload)).preferred_size,'small');
 for(const raw of ['{','x'.repeat(4000),JSON.stringify({...payload,sizes:'small'}),JSON.stringify({...payload,fullAnswers:{0:[{}]}})]) assert.equal(readGuestPreferences(raw),null);
});
test('guest filtering saves only a bounded cookie and never creates an adopter',async()=>{
 const cookies=[];
 const action=load('app/actions/preferences.ts',{
 'next/headers':{cookies:async()=>({set:(...args)=>cookies.push(args)})},
 'next/cache':{revalidatePath(){}},
 '@/utils/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:null}})}})},
 '@/utils/supabase/admin':{createAdminClient(){throw Error('No database write allowed');}},
 '@/utils/adopter':{ensureAdopterForUser(){throw Error('No adopter creation allowed');}},
 });
 assert.equal((await action.saveFilterPreferences(payload)).error,null);
 assert.equal(cookies[0][2].httpOnly,true);
 assert.equal(cookies[0][2].sameSite,'lax');
});
for(const context of [null,{role:'adopter',isGlobalAdmin:false,userId:'u'},{role:'shelter_admin',isGlobalAdmin:false,userId:'s'},{role:'shelter_admin',isGlobalAdmin:true,userId:'s'}]) {
 test(`export rejects ${context?.role??'signed-out'} before reading records`,async()=>{
 const route=load('app/api/admin/exports/[kind]/route.ts',{
 '@/utils/admin-auth':{getAdminAuthContext:async()=>context},
 '@/utils/supabase/admin':{createAdminClient(){throw Error('must not access DB');}},
 });
 for(const kind of ['dogs','bookings']) assert.equal((await route.GET(new Request('https://local/api/admin/exports/'+kind),{params:Promise.resolve({kind})})).status,403);
 });
}
test('HQ visits export contains useful associations but no notes or private identity fields',async()=>{
 const route=load('app/api/admin/exports/[kind]/route.ts',{
 '@/utils/admin-auth':{getAdminAuthContext:async()=>({role:'admin',isGlobalAdmin:true,userId:'hq'})},
 '@/utils/supabase/admin':{createAdminClient:()=>({})},
 '@/utils/hq-export':{readExportRows:async(_db,table,columns)=>{
 assert.doesNotMatch(columns,/visitor_note|shelter_note|token|document|email/);
 return table==='appointments'?[{id:'visit',dog_id:'dog',shelter_id:'shelter',status:'completed'}]:table==='dogs'?[{id:'dog',name:'Dog'}]:[{id:'shelter',name:'Shelter'}];
 }},
 });
 const response=await route.GET(new Request('https://local/api/admin/exports/bookings'),{params:Promise.resolve({kind:'bookings'})});
 assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
 assert.match(await response.text(),/"completed"/);
});
test('ZIP references real included photos and explicitly reports failed media',async()=>{
 const {dogArchive}=load('utils/hq-export.ts',{}, {fetch:async url=>url.includes('broken')?new Response('',{status:404}):new Response(new Uint8Array([137,80,78,71]),{headers:{'content-type':'image/png'}})});
 const dog={id:'abc',name:'น้อง',shelter_id:'s'};
 const photos=[{id:'1',dog_id:'abc',public_url:'https://media.pawjaipet.com/file/pawjai/good.png',is_cover:true,sort_order:0},{id:'2',dog_id:'abc',public_url:'https://media.pawjaipet.com/file/pawjai/broken.png',is_cover:false,sort_order:1}];
 const parts=[];for await(const part of dogArchive([dog],photos,[],[{id:'s',name:'Shelter'}],new AbortController().signal)) parts.push(Buffer.from(part));
 const files=unzipSync(Buffer.concat(parts));
 assert.ok(files['images/abc-0001.png']);
 assert.match(strFromU8(files['dogs.csv']),/images\/abc-0001.png/);
 const manifest=JSON.parse(strFromU8(files['manifest.json']));assert.equal(manifest.complete,false);assert.equal(manifest.media[1].reason,'http_404');
});
test('CSV neutralizes spreadsheet formulas and exports reject private or unexpected media URLs',()=>{
 const {csvCell,allowedExportMedia}=load('utils/export-format.ts');
 assert.equal(csvCell('=HYPERLINK("x")'),'"\'=HYPERLINK(""x"")"');
 for(const url of ['http://localhost/a','https://media.pawjaipet.com.evil/a','https://bdnyvcvkyepipdcygkvn.supabase.co/storage/v1/object/private/identity-documents/a']) assert.equal(allowedExportMedia(url),false);
});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

test('rejected first video never becomes cover and does not discard later photos', async () => {
  const source = readFileSync(new URL('../app/admin/dogs/new/DogListingForm.tsx', import.meta.url),'utf8');
  const ast = ts.createSourceFile('form.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let node;
  function walk(n) { if(ts.isFunctionDeclaration(n)&&n.name?.text==='handleMediaFilesChange') node=n; ts.forEachChild(n,walk); }
  walk(ast);
  const js = ts.transpileModule(node.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const state={};
  const bindings={
    setMediaError:v=>state.error=v, setMediaWarning:v=>state.warning=v, setRejectedMediaWarning:v=>state.rejected=v,
    setMediaItems:v=>state.items=v, setCoverMediaKey:v=>state.cover=v, setMediaPreparing:v=>state.preparing=v,
    setUploadProgress:()=>{}, SUPPORTED_VIDEO_EXTENSIONS:new Set(['mp4','mov']),
    getFileExtension:n=>n.split('.').pop(), isSupportedVideoFile:f=>f.type==='video/mp4',
    prepareLargeDogVideo:async()=>{throw new Error('video rejected');},
    CLIENT_VIDEO_WARNING_BYTES:25e6, CLIENT_MAX_PHOTO_FORM_MEDIA_BYTES:3.5e6,
    isHeicLikeFile:()=>false, compressPhotoForAdminUpload:async file=>({file,compressed:false}), formatFileSize:String,
    DataTransfer:class{files=[];items={add:file=>this.files.push(file)};},
  };
  const run=new Function(...Object.keys(bindings),`${js};return handleMediaFilesChange`)(...Object.values(bindings));
  const input={files:[new File(['video'],'bad.mp4',{type:'video/mp4'}),new File(['image'],'good.jpg',{type:'image/jpeg'})]};
  await run({currentTarget:input});
  assert.equal(input.files.length,1);
  assert.equal(input.files[0].name,'good.jpg');
  assert.equal(state.items.length,1);
  assert.equal(state.items[0].kind,'photo');
  assert.equal(state.cover,state.items[0].key);
  assert.equal(state.rejected,'video rejected');
  assert.equal(state.error,'');
  assert.equal(state.preparing,false);
});

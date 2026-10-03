import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
function load() {
  const module = {exports:{}};
  const storage = new Map();
  const window = { location:{pathname:'/swipe',search:'',hostname:'www.pawjaipet.com'}, localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}, dispatchEvent(){} };
  const document = {cookie:'',referrer:'https://example.com/private?email=secret'};
  const {outputText}=ts.transpileModule(readFileSync(new URL('../utils/google-analytics.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});
  new Script(outputText).runInNewContext({module,exports:module.exports,window,document,URL,URLSearchParams,Event});
  return {api:module.exports,window,document};
}
test('no Google events or initialization before consent; withdrawal stops capture',()=>{
  const {api,window}=load(); api.trackGA('login'); assert.equal(window.dataLayer,undefined);
  api.setAnalyticsConsent('granted'); api.trackGA('login'); assert.equal(window.dataLayer.length,4);
  assert.equal(window.dataLayer[0][2].ad_storage,'denied');
  api.setAnalyticsConsent('denied'); const length=window.dataLayer.length; api.trackGA('login'); assert.equal(window.dataLayer.length,length);
  assert.equal(window['ga-disable-G-PPD6QKJEHR'],true);
});
test('strips private IDs, query tokens, email UTMs, arbitrary metadata and private routes',()=>{
  const {api,window}=load();
  assert.equal(api.analyticsPath('/admin/accounts'),null);
  assert.equal(api.analyticsPath('/auth/callback'),null);
  assert.equal(api.analyticsPath('/appointments/private-id'),'/appointments/detail');
  const url=api.safeAnalyticsLocation('/auth','?token_hash=secret&utm_source=instagram&utm_campaign=person%40email.com');
  assert.equal(url,'https://www.pawjaipet.com/auth?utm_source=instagram');
  api.setAnalyticsConsent('granted'); api.trackGA('auth_failed',{reason:'invalid_credentials',email:'private@example.com',mode:'login'});
  const payload=window.dataLayer.at(-1)[2]; assert.equal(payload.email,undefined); assert.equal(payload.reason,'invalid_credentials'); assert.equal(payload.page_referrer,'https://example.com');
  window.location.pathname='/admin'; const n=window.dataLayer.length; api.trackGA('page_view'); assert.equal(window.dataLayer.length,n);
});
test('manual page views deduplicate rerenders but count later return visits',()=>{
  const {api,window}=load(); api.setAnalyticsConsent('granted');
  api.trackGAPage('/swipe'); api.trackGAPage('/swipe');
  window.location.pathname='/about'; api.trackGAPage('/about');
  window.location.pathname='/swipe'; api.trackGAPage('/swipe');
  assert.equal(window.dataLayer.filter(x=>x[0]==='event'&&x[1]==='page_view').length,3);
});
test('local and preview hosts never send production events',()=>{
  const {api,window}=load(); api.setAnalyticsConsent('granted');
  window.location.hostname='localhost'; api.trackGA('login'); api.trackGAPage('/swipe');
  assert.equal(window.dataLayer,undefined);
  window.location.hostname='preview.vercel.app'; api.trackGA('login');
  assert.equal(window.dataLayer,undefined);
});

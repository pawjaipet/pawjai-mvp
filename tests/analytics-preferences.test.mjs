import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function screen(initialPath = '/swipe', initialConsent = null, language = 'en') {
  let path = initialPath, consent = initialConsent, editingPath = null;
  const choices = [];
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  const imports = {
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    react: {
      useEffect() {},
      useState: () => [editingPath, value => { editingPath = value; }],
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
    'next/script': { default: 'script', __esModule: true },
    'next/link': { default: 'a', __esModule: true },
    'next/navigation': { usePathname: () => path },
    '@/components/i18n/LanguageProvider': { useLanguage: () => ({ language }) },
    '@/utils/auth-analytics': { consumeAuthAnalyticsReceipts: () => [] },
    '@/utils/google-analytics': {
      analyticsConsent: () => consent,
      analyticsHost: () => true,
      analyticsPath: value => value.startsWith('/admin') ? null : value,
      setAnalyticsConsent: value => { consent = value; choices.push(value); },
      GA_ID: 'test',
    },
  };
  const { outputText } = ts.transpileModule(readFileSync(new URL('../components/analytics/GoogleAnalytics.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  new Script(outputText).runInNewContext({ module, exports: module.exports, require: key => {
    if (!(key in imports)) throw new Error(key);
    return imports[key];
  } });
  function nodes() {
    const result = [];
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      result.push(node);
      walk(node.props?.children);
    }
    walk(module.exports.default());
    return result;
  }
  return { choices, nodes, navigate: value => { path = value; } };
}

test('arrival never prompts or grants consent, including new and returning visitors', () => {
  for (const path of ['/', '/swipe', '/dogs/065d6a6c-0029-4339-b39b-1bfa679e6e5d', '/auth', '/privacy', '/settings']) {
    for (const consent of [null, 'pending', 'denied', 'granted']) {
      const page = screen(path, consent);
      assert.equal(page.nodes().filter(node => node.type === 'section').length, 0);
      assert.equal(page.nodes().filter(node => node.type === 'script').length, consent === 'granted' ? 1 : 0);
      assert.deepEqual(page.choices, []);
    }
  }
});

test('English and Thai settings open explicitly and preserve allow/withdraw choices', () => {
  for (const language of ['en', 'th']) {
    const page = screen('/settings', null, language);
    page.nodes().find(node => node.type === 'button').props.onClick();
    const panel = page.nodes().find(node => node.type === 'section');
    assert.ok(panel);
    assert.equal(panel.props.className.includes('fixed'), false);
    const buttons = page.nodes().filter(node => node.type === 'button');
    buttons[1].props.onClick();
    assert.deepEqual(page.choices, ['granted']);
    assert.equal(page.nodes().some(node => node.type === 'section'), false);
    page.nodes().find(node => node.type === 'button').props.onClick();
    page.nodes().filter(node => node.type === 'button')[0].props.onClick();
    assert.deepEqual(page.choices, ['granted', 'denied']);
    assert.equal(page.nodes().some(node => node.type === 'script'), false);
  }
});

test('open preferences do not follow users back into browsing or private routes', () => {
  const page = screen('/privacy');
  page.nodes().find(node => node.type === 'button').props.onClick();
  assert.ok(page.nodes().some(node => node.type === 'section'));
  page.navigate('/swipe');
  assert.equal(page.nodes().some(node => node.type === 'section'), false);
  assert.equal(page.nodes().some(node => node.type === 'button'), false);
  page.navigate('/admin');
  assert.equal(page.nodes().length, 0);
  assert.deepEqual(page.choices, []);
});

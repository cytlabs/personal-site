const assert = require('node:assert/strict');
const { test } = require('node:test');

test('localized URLs preserve deployment prefixes, assets and external destinations', async () => {
  const { createLocalizer } = await import('./localization.mjs');
  const en = createLocalizer({}, {base:'/portside',origin:'https://example.com'});
  assert.equal(en.url('/blog/example/#section'), '/portside/en/blog/example/#section');
  assert.equal(en.url('/portside/cases/example/'), '/portside/en/cases/example/');
  assert.equal(en.url('/portside/en/about/'), '/portside/en/about/');
  assert.equal(en.url('/assets/styles.css'), '/portside/assets/styles.css');
  assert.equal(en.url('/portside/assets/main.js'), '/portside/assets/main.js');
  assert.equal(en.url('https://example.com/portside/resume/'), 'https://example.com/portside/en/resume/');
  assert.equal(en.url('https://github.com/cytlabs'), 'https://github.com/cytlabs');
  assert.equal(en.url('//external.example/file'), '//external.example/file');
  assert.equal(en.url('#contact'), '#contact');
});

test('missing translations fail explicitly and source changes invalidate article versions', async () => {
  const { createLocalizer } = await import('./localization.mjs');
  const { translationSourceHash } = await import('./translation-source.mjs');
  const en = createLocalizer({'首页':'Home'});
  assert.equal(en.text(' 首页 '), ' Home ');
  en.text('新的中文内容');
  assert.throws(() => en.assertComplete(), /Missing English translations/);
  const source = {title:'Title',summary:'Summary',category:'Topic',tags:['AI'],body:'Original'};
  assert.notEqual(translationSourceHash(source), translationSourceHash({...source,body:'Updated'}));
  assert.notEqual(translationSourceHash(source), translationSourceHash({...source,title:'Different'}));
});

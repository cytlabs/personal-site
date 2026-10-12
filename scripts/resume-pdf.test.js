const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('a changed resume overwrites the PDF and updates its content fingerprint and link', async () => {
  const root = path.resolve(__dirname, '..');
  const { readResumeContent } = await import('./resume-content.mjs');
  const { generateResumePdf } = await import('./resume-pdf.mjs');
  const cases = JSON.parse(await fs.readFile(path.join(root, 'content/case-studies.json')));
  const data = await readResumeContent({ root, cases, origin: 'https://example.com' });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-pdf-update-'));
  const file = path.join(dir, 'resume.pdf');
  try {
    const first = await generateResumePdf(data, file);
    const before = await fs.readFile(file);
    data.summary += ' 同步更新验证。';
    data.projects[0].publicUrl = 'https://example.com/updated-case/';
    const second = await generateResumePdf(data, file);
    const after = await fs.readFile(file);
    assert.notEqual(first.version, second.version);
    assert.notDeepEqual(before, after);
    assert.ok(after.toString('latin1').includes(`resume-source-sha256:${second.version}`));
    assert.ok(after.toString('latin1').includes('/URI (https://example.com/updated-case/)'));
    assert.ok(!after.toString('latin1').includes('/URI (https://example.com/cases/intent/)'));
    data.summary += ' 🧪';
    await assert.rejects(generateResumePdf(data, file), /font does not support/);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

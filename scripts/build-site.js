// Compatibility entry point: all complete builds now use the integrated UI.
async function buildSite() {
  const { build } = await import('./build.mjs');
  await build();
}

if (require.main === module) {
  buildSite().catch(error => { console.error(error); process.exitCode = 1; });
}

module.exports = { buildSite };

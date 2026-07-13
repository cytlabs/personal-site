const fs = require("node:fs");
const path = require("node:path");
const { buildBlog, resolveResourcesDir } = require("./build-blog");

const siteDir = path.resolve(__dirname, "..");
const distDir = path.join(siteDir, "dist");

const files = [
  "index.html",
  "styles.css",
  "script.js",
  "markdown-renderer.js",
];

const directories = ["about", "assets", "blog", "cases", "generated"];

function copyIfExists(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }
  fs.cpSync(source, target, { recursive: true });
}

function buildSite() {
  buildBlog({
    resourcesDir: resolveResourcesDir(siteDir),
    siteDir,
  });

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  for (const file of files) {
    copyIfExists(path.join(siteDir, file), path.join(distDir, file));
  }

  for (const directory of directories) {
    copyIfExists(path.join(siteDir, directory), path.join(distDir, directory));
  }

  console.log(`Built static site in ${path.relative(siteDir, distDir)}/`);
}

if (require.main === module) {
  buildSite();
}

module.exports = {
  buildSite,
};

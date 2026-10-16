/* Checks local navigation, asset references. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
for (const file of ['index.html', '404.html']) {
  const html = fs.readFileSync(path.join(root,file),'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,`${file}: duplicate IDs`);
  for (const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|data:)/.test(url)) continue;
    const [pathname,hash] = url.split('#');
    const target = pathname.split('?')[0];
    const destination = target ? path.join(root,target === '/' ? 'index.html' : target) : path.join(root,file);
    assert.ok(fs.existsSync(destination),`${file}: missing ${url}`);
    if (hash) assert.ok(fs.readFileSync(destination,'utf8').includes(`id="${hash}"`),`${file}: broken anchor ${url}`);
  }
}
console.log('Passed: local navigation, assets and unique IDs.');

/* Checks local navigation, asset references and the contact draft contract. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
for (const file of ['index.html', 'contact.html', '404.html']) {
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
const {buildInquiry} = require('../js/contact.js');
const email = 'guilden.business@gmail.com';
for (const project of ['build','redesign','question','invalid']) {
  const draft = buildInquiry({project,name:'A & B',idea:'Hello\nUn jeu à créer & améliorer',gameUrl:'https://www.roblox.com/games/123/test'},email);
  const params = new URLSearchParams(draft.href.split('?')[1]);
  assert.ok(draft.href.startsWith(`mailto:${email}?`));
  assert.equal(params.get('body'),draft.body);
  assert.ok(draft.body.includes('Un jeu à créer & améliorer'));
  assert.equal(draft.body.includes('Roblox game:'),project === 'redesign');
  assert.ok(!params.get('subject').includes('undefined'));
}
console.log('Passed: local navigation, assets, unique IDs, and all contact draft types.');

/* Verify scroll interpolation and accessibility without browser timing. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/story.js'), 'utf8');
function element(dataset = {}) {
  const children = new Map(), attrs = new Map(), classes = new Set();
  return {
    dataset, textContent: '',
    style: { setProperty() {} },
    classList: { toggle(key, enabled) { enabled ? classes.add(key) : classes.delete(key); } },
    setAttribute(key, value) { attrs.set(key, value); },
    removeAttribute(key) { attrs.delete(key); },
    getAttribute(key) { return attrs.get(key); },
    querySelector(key) { if (!children.has(key)) children.set(key, element()); return children.get(key); }
  };
}
const cards = [[4.2,32.6,'%',40],[7.9,18.4,' min',20],[32.3,186.4,' R$',200]].map(([from,to,unit,max]) => element({from,to,unit,max,decimals:1,note:'A short explanation.'}));
const context = { stats: element(), cards, steps: cards.map(() => element()), plot: element(), line: element(), area: element(), dot: element(), compact: {matches:true}, reduced: {matches:false} };
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('  function clamp'), source.indexOf('  var galleryRoot')), context);
const readValues = () => cards.map(c => parseFloat(c.querySelector('[data-value]').textContent));
let previous = cards.map(c => c.dataset.from);
for (let step = 0; step <= 300; step++) {
  context.renderStats(step / 300);
  const values = readValues();
  values.forEach((value,i) => {
    assert.ok(value >= previous[i] && value <= cards[i].dataset.to, 'Values stay monotonic and bounded');
  });
  assert.equal(cards.filter(c => c.getAttribute('aria-hidden') !== 'true').length, 1, 'One accessible metric on mobile');
  assert.ok(!/NaN|Infinity/.test(context.line.getAttribute('d')), 'Finite chart coordinates');
  previous = values;
}
assert.deepEqual(readValues(), [32.6,18.4,186.4]);
context.renderStats(0);
assert.deepEqual(readValues(), [4.2,7.9,32.3], 'Reverse scroll restores baseline');
context.compact.matches = false;
context.renderStats(.5);
assert.equal(cards.filter(c => c.getAttribute('aria-hidden') === 'true').length, 0, 'Desktop exposes every metric');
context.compact.matches = true;
context.reduced.matches = true;
context.renderStats(1);
assert.equal(cards.filter(c => c.getAttribute('aria-hidden') === 'true').length, 0, 'Reduced motion exposes every final comparison');
assert.deepEqual(readValues(), [32.6,18.4,186.4]);
console.log('Passed: sequential progression, bounds, reverse scroll, chart coordinates and reduced-motion accessibility.');

/* Run against the local static server. Requires Playwright and installed Edge. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const output = path.join(__dirname, '../docs/qa');
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const [width,height] of [[1440,960],[1280,720],[768,1024],[390,844],[375,667],[320,568]]) {
      const page = await browser.newPage({ viewport: {width,height}, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:4173/', {waitUntil:'networkidle'});
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('main > section').count(),5, 'All main chapters retain their document hierarchy');
      assert.equal(await page.locator('.genre-item').count(),6);
      assert.equal(await page.locator('.game-gallery figure').count(),2);
      assert.equal(await page.locator('.simulation-panel, .analytics').count(),0);
      assert.equal(await page.locator('form').count(),0);
      assert.ok((await page.locator('.contact-email').getAttribute('href')).startsWith('mailto:guilden.business@gmail.com?'));
      for (const id of ['top','vision','game-types','games','process','questions','contact']) {
        await page.locator('#'+id).scrollIntoViewIfNeeded();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `No overflow: ${width}px / ${id}`);
      }
      await page.getByText('How much does a game cost?', {exact:true}).click();
      assert.ok(await page.locator('details').first().evaluate(el=>el.open));
      if(width<=900) {
        await page.getByRole('button',{name:'Menu',exact:true}).click();
        assert.equal(await page.locator('main').evaluate(el=>el.inert),true);
        await page.getByRole('navigation').getByRole('link',{name:'Game types',exact:true}).click();
        assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'false');
        assert.equal(await page.locator('main').evaluate(el=>el.inert),false);
        await page.getByRole('button',{name:'Menu',exact:true}).click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'false');
      }
      if (width===1440 || width===390) {
        await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({path:path.join(output,`commissions-${width}-hero.png`)});
        await page.locator('#vision').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,`commissions-${width}-offer.png`)});
      }
      assert.deepEqual(errors,[], 'No JavaScript errors');
      console.log(`Passed ${width}x${height}: content, links, overflow, FAQ and menu.`);
      await page.close();
    }
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:4173/',{waitUntil:'networkidle'});
    for(const id of ['vision','game-types','games','process','contact','top']) {
      await page.locator('#'+id).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }
    assert.deepEqual(errors,[], 'Hero animation and scroll navigation stay functional');
    console.log('Passed normal-motion mobile journey.');
    await page.close();
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

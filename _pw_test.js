const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:8080/', { waitUntil: 'load' });
  await page.waitForTimeout(1800);

  const contentChildren = await page.evaluate(() => document.getElementById('content')?.children.length || 0);
  const hasMenu = await page.evaluate(() => !!document.getElementById('menuToggle'));

  // open drawer
  let opened = false, closedByOverlay = false, closedByX = false;
  if (hasMenu) {
    await page.click('#menuToggle');
    await page.waitForTimeout(500);
    opened = await page.evaluate(() => document.getElementById('sidebar')?.classList.contains('open'));
    const overlay = await page.$('#sidebarOverlay');
    if (overlay) {
      const box = await overlay.boundingBox();
      await page.mouse.click(box.x + box.width - 20, box.y + box.height / 2); // tap right edge (overlay area)
      await page.waitForTimeout(500);
      closedByOverlay = await page.evaluate(() => !document.getElementById('sidebar')?.classList.contains('open'));
    }
    if (!closedByOverlay) {
      await page.click('#menuToggle'); await page.waitForTimeout(400);
      const xbtn = await page.$('.sidebar-close');
      if (xbtn) { await xbtn.click({ force: true }); await page.waitForTimeout(400); closedByX = await page.evaluate(() => !document.getElementById('sidebar')?.classList.contains('open')); }
    }
  }

  // scroll test on content
  const scrollInfo = await page.evaluate(() => {
    const c = document.getElementById('content');
    return { scrollHeight: c?.scrollHeight, clientHeight: c?.clientHeight, overflowY: c ? getComputedStyle(c).overflowY : null };
  });

  // nav item click test: open drawer, click first nav-item, check content updates
  let navWorks = false;
  await page.click('#menuToggle'); await page.waitForTimeout(400);
  const firstNav = await page.$('.nav-item');
  if (firstNav) {
    const before = await page.evaluate(() => document.getElementById('content')?.innerHTML.length);
    await firstNav.click({ force: true });
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => document.getElementById('content')?.innerHTML.length);
    const drawerClosed = await page.evaluate(() => !document.getElementById('sidebar')?.classList.contains('open'));
    navWorks = drawerClosed && after !== before;
  }

  // FAB test
  let fabWorks = false;
  const fab = await page.$('.quick-fab');
  if (fab) {
    await fab.click({ force: true });
    await page.waitForTimeout(400);
    fabWorks = await page.evaluate(() => document.querySelector('.fab-sheet')?.classList.contains('open'));
  }

  console.log(JSON.stringify({
    contentChildren, hasMenu, opened, closedByOverlay, closedByX,
    scrollInfo, navWorks, fabWorks, errors
  }, null, 2));

  await browser.close();
})().catch(e => { console.error('TEST ERROR:', e); process.exit(1); });

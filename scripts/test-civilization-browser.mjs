// Fresh isolated browser contexts only; never touches the user's browser storage.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
const url=process.env.CIV_TEST_URL ?? 'http://127.0.0.1:4181/#/games/civilization';
const executablePath=existsSync(chromium.executablePath()) ? chromium.executablePath() : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({headless:true,executablePath});
try {
  for(const width of [375,768,1024,1440]) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    await page.getByRole('button',{name:'建立新世界'}).click();
    await page.getByRole('button',{name:'建立城市',exact:true}).click();
    await page.getByRole('button',{name:'科技',exact:true}).click();
    await page.locator('.research-node').first().waitFor();
    assert.equal(await page.locator('.research-node').count(),77);
    assert.equal(await page.locator('.research-node').first().evaluate(e=>getComputedStyle(e).display),'block','node contents must stack, not inherit the generic button flex row');
    await page.getByLabel('搜索科技').fill('教育');
    await page.locator('.research-node').filter({hasText:'教育'}).click();
    assert.match(await page.locator('.research-summary').innerText(),/数学.*学徒|学徒.*数学/);
    assert(await page.getByRole('link',{name:'百科原条目'}).getAttribute('href'));
    await page.getByRole('button',{name:'研究规则',exact:true}).click();
    assert.match(await page.getByRole('tooltip').innerText(),/进度.*尚未实现/);
    await page.keyboard.press('Escape');
    if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`research-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'列表视图',exact:true}).click();
    assert.equal(await page.locator('.research-list button').first().evaluate(e=>getComputedStyle(e).display),'block');
    await page.getByRole('button',{name:'连线视图',exact:true}).click();
    await page.getByRole('button',{name:'市政',exact:true}).click();
    assert.equal(await page.locator('.research-node').count(),61);
    await page.getByRole('button',{name:'地图',exact:true}).click();
    await page.getByRole('button',{name:'下一回合',exact:true}).click();
    const confirm=page.getByRole('button',{name:'直接结束回合',exact:true});
    await confirm.waitFor({state:'visible'});
    await confirm.click();
    await page.waitForTimeout(500);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3') ?? 'null'));
    assert(saved && saved.version===3 && saved.turn>=2,JSON.stringify({turn:saved?.turn,errors,footer:await page.locator('.turn-footer').innerText(),dialogs:await page.getByRole('dialog').allTextContents()}));
    await page.reload();
    const politicsFixture=await page.evaluate(()=>{
      const state=JSON.parse(localStorage.getItem('aoinatsu:civilization:v3'));
      state.nations[0].civic=['laws','philosophy','mysticism','trade','craft','stateworkforce'];
      state.nations[0].policyFree=true;
      return state;
    });
    // Set fixture after pagehide flush; editing storage just before reload races
    // the game's intentional final save and can be overwritten by the old page.
    await page.addInitScript(state=>localStorage.setItem('aoinatsu:civilization:v3',JSON.stringify(state)),politicsFixture);
    await page.reload();
    await page.getByRole('button',{name:'政体',exact:true}).click();
    assert.equal(await page.locator('.government-grid button').count(),13);
    assert.equal(await page.locator('.government-reference').evaluate(e=>e.open),false);
    await page.getByLabel('政体',{exact:true}).selectOption('oligarchy');
    await page.getByLabel('军事政策槽 1',{exact:true}).selectOption('discipline');
    await page.getByLabel('军事政策槽 2',{exact:true}).selectOption('agoge');
    await page.getByLabel('经济政策槽 3',{exact:true}).selectOption('planning');
    await page.getByLabel('通配政策槽 4',{exact:true}).selectOption('league');
    await page.getByRole('button',{name:'应用',exact:true}).click();
    await page.waitForTimeout(500);
    const politics=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')).nations[0]);
    assert.equal(politics.government,'oligarchy');assert.deepEqual(politics.policies,['discipline','agoge','planning','league']);
    const slotsBox=await page.locator('.policy-slots').boundingBox();
    assert(slotsBox.height<270,`policy slots too tall: ${slotsBox.height}px at ${width}px`);
    assert(await page.locator('.civ-panel-content').evaluate(e=>e.getBoundingClientRect().height)<470,'default government panel should fit without a long reference list');
    const policyHelp=page.getByRole('button',{name:'政策效果 4',exact:true});
    if(width===375) await policyHelp.tap(); else await policyHelp.click();
    const tooltip=page.getByRole('tooltip');
    await tooltip.waitFor();
    assert.match(await tooltip.innerText(),/第一个.*使者/);
    const tipBox=await tooltip.boundingBox();
    assert(tipBox.x>=0 && tipBox.x+tipBox.width<=width && tipBox.y>=0 && tipBox.y+tipBox.height<=900,'tooltip should stay inside viewport');
    assert(await policyHelp.evaluate(e=>e.getBoundingClientRect().width)>=44);
    if(width===375) assert.equal(await tooltip.evaluate(e=>getComputedStyle(e).fontSize),'16px');
    await page.keyboard.press('Escape');
    await tooltip.waitFor({state:'hidden'});
    await page.getByRole('button',{name:'政体效果',exact:true}).focus();
    await tooltip.waitFor();
    assert.match(await tooltip.innerText(),/战斗力|经验/);
    await page.keyboard.press('Escape');
    await page.locator('.page-heading h2').click();
    await policyHelp.hover();
    await tooltip.waitFor();
    await policyHelp.click(); // Pin so pointer movement into the tooltip can be read.
    await tooltip.hover();
    await page.waitForTimeout(180);
    assert(await tooltip.isVisible());
    await page.locator('.page-heading h2').click();
    await tooltip.waitFor({state:'hidden'});
    await page.locator('.government-reference summary').click();
    assert(await page.locator('.government-grid button').first().isVisible());
    await page.locator('.government-reference summary').click();
    if(process.env.CIV_SCREENSHOT_DIR) {
      await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`politics-${width}.png`),fullPage:true});
      await page.locator('.policy-slots').evaluate(element=>element.scrollIntoView({block:'start'}));
      await page.locator('.policy-slots').screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`policy-slots-${width}.png`)});
    }
    await page.getByRole('button',{name:'进度',exact:true}).click();
    assert.match(await page.locator('.victory-grid').innerText(),/50|游客/);
    await page.getByRole('button',{name:'科学胜利条件',exact:true}).click();
    await tooltip.waitFor();
    assert.match(await tooltip.innerText(),/远征|光年/);
    await page.keyboard.press('Escape');
    if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`progress-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'存档',exact:true}).click();
    await page.getByRole('button',{name:'存档位置与备份',exact:true}).click();
    assert.match(await tooltip.innerText(),/清理.*失去进度/);
    await page.keyboard.press('Escape');
    if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`saves-${width}.png`),fullPage:true});
    for(const [name,className] of [['外交','diplomacy'],['信仰','faith'],['城市','cities']]) {
      await page.getByRole('button',{name,exact:true}).click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name} overflow at ${width}px`);
      if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`${className}-${width}.png`),fullPage:true});
    }
    if(width===375) {
      await page.setViewportSize({width,height:667});
      await page.getByRole('button',{name:'展开游戏',exact:true}).tap();
      await page.getByRole('button',{name:'政体',exact:true}).tap();
      await policyHelp.tap();
      await tooltip.waitFor();
      const mobileBox=await tooltip.boundingBox();
      assert(mobileBox.y>=0 && mobileBox.y+mobileBox.height<=667,'expanded mobile tooltip should remain in viewport');
      assert.equal(await tooltip.evaluate(e=>getComputedStyle(e).zIndex),'100');
      await page.keyboard.press('Escape');
      await page.getByRole('button',{name:'收起游戏',exact:true}).tap();
      assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden','leaving expanded mode restores page scroll');
    }
    const oldSnapshot=await page.evaluate(()=>{
      const old=JSON.parse(localStorage.getItem('aoinatsu:civilization:v3'));
      old.version=2;
      for(const n of old.nations){delete n.totalCulture;delete n.tourismAgainst;delete n.space;delete n.barbarianKills;}
      const raw=JSON.stringify(old);
      return raw;
    });
    const migrationContext=await browser.newContext({viewport:{width,height:900}});
    await migrationContext.addInitScript(raw=>localStorage.setItem('aoinatsu:civilization:v2',raw),oldSnapshot);
    const migrationPage=await migrationContext.newPage();
    await migrationPage.goto(url);
    await migrationPage.getByText('已迁移旧存档，原存档仍保留。',{exact:true}).waitFor();
    assert.equal(await migrationPage.evaluate(()=>localStorage.getItem('aoinatsu:civilization:v2')),oldSnapshot);
    await migrationContext.close();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
    assert(!overflow,`page overflow at ${width}px`);
    assert.deepEqual(errors,[],`runtime errors at ${width}px`);
    console.log(`✓ ${width}px: founding, full trees, government/policies, turn, autosave/reload, victory progress and non-destructive v2 migration`);
    await context.close();
  }
} finally {await browser.close();}

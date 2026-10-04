// Fresh isolated browser contexts only; never touches the user's browser storage.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { moduleUrl } from './civilization-test-module.mjs';
const rules=await import(moduleUrl('src/games/civilization/world.ts'));
const saveRules=await import(moduleUrl('src/games/civilization/saves.ts'));
const url=process.env.CIV_TEST_URL ?? 'http://127.0.0.1:4181/#/games/civilization';
const executablePath=existsSync(chromium.executablePath()) ? chromium.executablePath() : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({headless:true,executablePath});
try {
  for(const width of (process.env.CIV_TEST_WIDTHS?.split(',').map(Number) ?? [375,768,1024,1440])) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    await page.getByRole('button',{name:'建立新世界'}).click();
    await page.getByRole('button',{name:'建立城市',exact:true}).click();
    assert.equal(await page.locator('.production-queue li').count(),0,'new human city must not silently queue a monument');
    const warriorCard=page.locator('.build-catalog article').filter({has:page.locator('.build-heading strong').getByText('勇士',{exact:true})});
    await warriorCard.getByRole('button',{name:'加入队列',exact:true}).click();
    assert.equal(await page.locator('.production-queue li').count(),1);
    await page.getByRole('button',{name:'移出队列勇士',exact:true}).click();
    assert.equal(await page.locator('.production-queue li').count(),0);
    await warriorCard.getByRole('button',{name:'勇士效果',exact:true}).click();
    assert(await page.getByRole('tooltip').innerText());
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'科技',exact:true}).click();
    await page.locator('.research-node').first().waitFor();
    assert.equal(await page.locator('.research-node').count(),77);
    assert.equal(await page.locator('.era-column').count(),9,'each era gets one truthful heading');
    assert(await page.locator('.research-summary button').filter({hasText:'研究中'}).isDisabled());
    await page.getByLabel('搜索科技').fill('高级人工智能');
    const futureNode=page.locator('[data-research="advancedai"]');
    await futureNode.waitFor();
    assert.equal(await futureNode.getAttribute('data-era'),'8');
    assert.equal(await futureNode.evaluate(e=>e.classList.contains('unlocked')),false);
    assert.match(await page.locator('.research-summary').innerText(),/机器人技术/);
    assert(await page.getByRole('button',{name:'开始研究',exact:true}).isDisabled());
    await page.waitForFunction(()=>{
      const node=document.querySelector('[data-research="advancedai"]').getBoundingClientRect(),scroll=document.querySelector('.tree-scroll').getBoundingClientRect();
      return node.x>=scroll.x && node.right<=scroll.right;
    });
    await page.getByRole('button',{name:'当前研究',exact:true}).click();
    await page.getByLabel('搜索科技').fill('采矿业');
    await page.getByRole('button',{name:'开始研究',exact:true}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')).nations[0].research==='mining');
    await page.getByLabel('搜索科技').fill('制陶术');
    await page.getByRole('button',{name:'开始研究',exact:true}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')).nations[0].research==='pottery');
    await page.getByRole('button',{name:'当前研究',exact:true}).click();
    await page.getByLabel('跳转研究时代').selectOption('8');
    assert.match(await page.locator('.research-summary').innerText(),/海洋家园|高级|控制论|智能材料|预报/);
    await page.getByRole('button',{name:'当前研究',exact:true}).click();
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
    await page.getByRole('button',{name:'展开游戏',exact:true}).click();
    await page.setViewportSize({width,height:width===375?667:800});
    await page.getByRole('button',{name:'当前研究',exact:true}).click();
    const layout=await page.evaluate(()=>{
      const tree=document.querySelector('.tree-scroll').getBoundingClientRect(),footer=document.querySelector('.turn-footer').getBoundingClientRect(),workspace=document.querySelector('.civ-workspace');
      return {treeHeight:tree.height,treeBottom:tree.bottom,footerTop:footer.top,footerBottom:footer.bottom,viewport:innerHeight,workspaceHeight:workspace.getBoundingClientRect().height,scrollHeight:workspace.scrollHeight};
    });
    if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`research-expanded-${width}.png`)});
    assert(layout.treeHeight>=(width===375?220:400),JSON.stringify(layout));
    assert(layout.treeBottom<=layout.footerTop+1,'tree may not disappear below the fixed turn controls');
    assert(layout.footerBottom<=layout.viewport+1,'next turn stays visible');
    assert(layout.scrollHeight<=layout.workspaceHeight+1,'expanded mode must not scroll away its own header');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.locator('.unlock-details summary').click();
    const encyclopedia=page.locator('.unlock-details a').first();
    assert(await encyclopedia.evaluate(e=>{
      const b=e.getBoundingClientRect();
      return b.height>=44 && b.x>=0 && b.right<=innerWidth && b.y>=0 && b.bottom<=innerHeight && e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));
    }),'encyclopedia menu link must be visible and hit-testable, not clipped by the toolbar');
    assert(await encyclopedia.getAttribute('href'));
    if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`research-unlocks-${width}.png`)});
    await page.locator('.unlock-details summary').click();
    await page.getByRole('button',{name:'收起游戏',exact:true}).click();
    await page.setViewportSize({width,height:900});
    await page.getByRole('button',{name:'市政',exact:true}).click();
    assert.equal(await page.locator('.research-node').count(),61);
    await page.getByRole('button',{name:'地图',exact:true}).click();
    const yieldButton=page.getByRole('button',{name:'显示地块产出',exact:true});
    const centerButton=page.getByRole('button',{name:'定位当前单位或城市',exact:true});
    assert.equal(await centerButton.getAttribute('aria-pressed'),null,'recenter is an action, not a toggle');
    const mapTip=page.getByRole('tooltip');
    const pressed=await yieldButton.getAttribute('aria-pressed');
    if(width===375) {
      const touch=await context.newCDPSession(page);
      for(const [button,explanation] of [[yieldButton,/粮食.*生产力.*金币/],[centerButton,/不.*移动|不.*消耗/]]) {
        await button.scrollIntoViewIfNeeded();
        const cameraBefore=await page.locator('.world-scroll').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));
        const unitsBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')).units);
        const b=await button.boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
        await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        await page.waitForTimeout(650);
        await mapTip.waitFor();assert.match(await mapTip.innerText(),explanation);
        await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.waitForTimeout(100);
        assert.equal(await yieldButton.getAttribute('aria-pressed'),pressed,'long press must not activate the map layer');
        assert.deepEqual(await page.locator('.world-scroll').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop})),cameraBefore,'long press must not recenter the map');
        assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')).units),unitsBefore,'help must not change units');
        await page.keyboard.press('Escape');
      }
      const b=await yieldButton.boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+25,y}]});
      await page.waitForTimeout(650);
      assert.equal(await mapTip.isVisible(),false,'moving the finger cancels long press');
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.equal(await yieldButton.getAttribute('aria-pressed'),pressed,'dragging must not activate the button');
      await touch.detach();
      await yieldButton.tap();
    } else {
      await yieldButton.hover();await mapTip.waitFor();
      assert.match(await mapTip.innerText(),/粮食.*生产力.*金币/);
      await page.keyboard.press('Escape');await yieldButton.click();
    }
    assert.notEqual(await yieldButton.getAttribute('aria-pressed'),pressed,'short click toggles the layer');
    if(pressed==='true')await yieldButton.click();
    await page.keyboard.press('Escape');
    await page.locator('.yield-legend').waitFor();
    assert.match(await page.locator('.yield-legend').innerText(),/粮食.*生产力.*金币/s);
    if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`map-${width}.png`),fullPage:true});
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
    // Blur and pointerleave may arrive together. Both must share one dismiss timer.
    await policyHelp.dispatchEvent('pointerleave');
    await policyHelp.dispatchEvent('blur');
    await policyHelp.hover();
    await tooltip.waitFor();
    await policyHelp.click(); // Pin so pointer movement into the tooltip can be read.
    assert.equal(await policyHelp.getAttribute('aria-expanded'),'true');
    await page.waitForTimeout(50);
    assert.equal(await policyHelp.getAttribute('aria-expanded'),'true');
    const readableBox=await tooltip.boundingBox();assert(readableBox);
    await page.mouse.move(readableBox.x+readableBox.width/2,readableBox.y+readableBox.height/2);
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
  for(const [width,height] of [[667,375],[844,390]]) {
    const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
    await page.getByRole('button',{name:'建立新世界'}).click();await page.getByRole('button',{name:'建立城市',exact:true}).click();
    await page.getByRole('button',{name:'展开游戏',exact:true}).click();
    const hit=locator=>locator.evaluate(e=>{
      const b=e.getBoundingClientRect();return b.y>=0&&b.bottom<=innerHeight&&e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));
    });
    for(const tab of ['科技','市政']) {
      await page.getByRole('button',{name:tab,exact:true}).click();
      assert((await page.locator('.tree-scroll').boundingBox()).height>=180,'landscape tree must not collapse');
      const node=page.locator('.research-node').first();await node.scrollIntoViewIfNeeded();assert(await hit(node),'landscape nodes are reachable above the turn bar');await node.tap();
      const next=page.getByRole('button',{name:'下一回合',exact:true});assert(await hit(next),'scrolling the panel must leave the turn action visible');
      await page.locator('.unlock-details summary').click();const link=page.locator('.unlock-details a').first();await link.scrollIntoViewIfNeeded();assert(await hit(link),'landscape encyclopedia links remain reachable');await page.locator('.unlock-details summary').click();
      await page.getByRole('button',{name:'列表视图',exact:true}).click();assert((await page.locator('.research-list').boundingBox()).height>=180);
      const last=page.locator('.research-list button').last();await last.scrollIntoViewIfNeeded();assert(await hit(last),'the entire landscape list can scroll');await last.tap();assert.match(await page.locator('.research-summary').innerText(),/未来/);
      if(process.env.CIV_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`research-landscape-list-${tab}-${width}.png`)});
      await page.getByRole('button',{name:'连线视图',exact:true}).click();await page.getByRole('button',{name:'当前研究',exact:true}).click();
      await node.scrollIntoViewIfNeeded();assert(await hit(node));
      if(process.env.CIV_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`research-landscape-${tab}-${width}.png`)});
    }
    await page.setViewportSize({width:375,height:667});await page.getByRole('button',{name:'当前研究',exact:true}).click();
    assert((await page.locator('.tree-scroll').boundingBox()).height>=220,'rotation restores the normal portrait layout');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
    console.log(`✓ ${width}×${height}: landscape tech/civic trees, full lists, encyclopedia, fixed turn controls and portrait rotation`);await context.close();
  }
  for(const width of [375,1440]) {
    const fixture=rules.create({seed:42,size:'compact',speed:'normal'});rules.found(fixture,fixture.units.find(u=>u.owner===0&&u.type==='settler'));
    const city=fixture.cities.find(c=>c.owner===0),at=rules.neighbors(fixture,city.tile)[0];fixture.nations[0].tech.push('masonry');
    Object.assign(fixture.tiles[at],{terrain:'desert',baseTerrain:'desert',hills:false,feature:'',resource:'',district:'',territory:city.id,owner:0});
    assert(rules.enqueue(fixture,city,'pyramids',at));const job=city.queue.shift(),key=rules.jobKey(job);city.invested[key]=23;
    const lockedCost=city.productionCosts[key],turns=Math.ceil((lockedCost-23)/rules.productionRate(fixture,city,'pyramids'));assert(saveRules.valid(fixture));
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375});
    await context.addInitScript(state=>{if(!localStorage.getItem('aoinatsu:civilization:v3'))localStorage.setItem('aoinatsu:civilization:v3',JSON.stringify(state));},fixture);
    const page=await context.newPage();await page.goto(url);await page.getByRole('button',{name:'城市',exact:true}).click();await page.getByRole('button',{name:'管理',exact:true}).first().click();
    const card=page.locator('.build-catalog article').filter({has:page.getByText('金字塔',{exact:true})});
    assert.match(await card.innerText(),new RegExp(`${lockedCost} 生产.*${turns} 回合.*已投入 23`));
    await card.getByRole('button',{name:'定位金字塔建设地块',exact:true}).click();
    assert.equal(await page.locator(`[data-tile="${at}"] .selection-ring`).count(),1);
    await page.getByRole('button',{name:'城市',exact:true}).click();await page.getByRole('button',{name:'管理',exact:true}).first().click();
    await card.getByRole('button',{name:'继续建设',exact:true}).click();await page.waitForTimeout(350);
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3'))),loadedCity=saved.cities.find(c=>c.owner===0);
    assert.deepEqual(loadedCity.queue,[job]);assert.equal(loadedCity.invested[key],23);assert.equal(loadedCity.productionCosts[key],lockedCost);assert(saveRules.valid(saved));
    await page.reload();await page.getByRole('button',{name:'城市',exact:true}).click();await page.getByRole('button',{name:'管理',exact:true}).first().click();
    await page.getByRole('button',{name:'移出队列金字塔',exact:true}).click();assert.match(await card.innerText(),/已投入 23/);await card.getByRole('button',{name:'继续建设',exact:true}).click();await page.waitForTimeout(350);
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));loadedCity=saved.cities.find(c=>c.owner===0);assert.deepEqual(loadedCity.queue,[job]);assert.equal(loadedCity.invested[key],23);
    if(process.env.CIV_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`wonder-resume-${width}.png`),fullPage:true});
    console.log(`✓ ${width}px: cancelled wonder investment, remaining turns, original site, actual resume and reload`);await context.close();
  }
  for(const width of [375,1440]) for(const aiCount of [1,5]) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375}),page=await context.newPage();
    await page.goto(url);
    await page.getByLabel('你的文明',{exact:true}).selectOption('random');
    await page.getByLabel('AI 数量',{exact:true}).selectOption(String(aiCount));
    const cityStateCount=aiCount===5?6:3;
    await page.getByLabel('城邦数量',{exact:true}).selectOption(String(cityStateCount));
    await page.getByLabel('随机种子',{exact:true}).fill('browser-random-42');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'new game setup fits mobile');
    if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`setup-${width}-${aiCount}.png`),fullPage:true});
    await page.getByRole('button',{name:'建立新世界',exact:true}).click();
    await page.getByRole('button',{name:'建立城市',exact:true}).click();
    await page.waitForTimeout(500);
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));
    assert.equal(state.options.aiCount,aiCount);assert.equal(state.options.civilization,'random');
    assert.equal(state.nations.filter(n=>n.kind==='major').length,aiCount+1);
    assert.equal(state.options.cityStateCount,cityStateCount);
    assert.equal(state.nations.length,aiCount+cityStateCount+2);
    assert(state.nations.every(n=>n.tourismAgainst.length===aiCount+1));
    await page.reload();
    await page.getByRole('button',{name:'外交',exact:true}).click();
    assert.equal(await page.locator('.diplomacy-grid > article').count(),aiCount+cityStateCount);
    for(const article of await page.locator('.diplomacy-grid > article').all()) {
      if((await article.locator('h3').innerText())==='未知城邦') {
        assert.equal(await article.locator('button').count(),0,'unknown city states reveal no type, bonus or action');
        assert((await article.boundingBox()).height<100,'unknown city-state cards stay compact');
      }
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'expanded diplomacy fits mobile');
    if(process.env.CIV_SCREENSHOT_DIR) await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`diplomacy-${width}-${aiCount}.png`),fullPage:true});
    if(width===375 && aiCount===1) {
      const religious=structuredClone(state),n=religious.nations[0],city=religious.cities.find(c=>c.owner===0);
      n.religion='Test';n.faith=1000;city.religion=0;city.pressure[0]=100;city.buildings.push('holy','shrine');religious.options.speed='normal';
      religious.units=religious.units.filter(u=>u.tile!==city.tile);
      assert(!n.civic.includes('theology'),'missionary must not depend on theology');
      await page.addInitScript(s=>localStorage.setItem('aoinatsu:civilization:v3',JSON.stringify(s)),religious);
      await page.reload();
      const missionary=page.locator('.build-catalog article').filter({hasText:'传教士'});await missionary.waitFor();
      assert.match(await missionary.locator('.build-price').innerText(),/仅信仰购买.*150/);
      assert(!await missionary.getByRole('button',{name:'加入队列',exact:true}).count());
      await missionary.getByRole('button',{name:'信仰 150',exact:true}).tap();await page.waitForTimeout(500);
      const bought=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));
      assert.equal(bought.nations[0].faith,850);assert.equal(bought.units.find(u=>u.type==='missionary' && u.owner===0).charges,3);
      console.log('✓ mobile missionary: shrine unlock without theology, faith-only price and actual purchase');
    }
    console.log(`✓ ${width}px: random civilization, ${aiCount} AI, reload and dynamic diplomacy`);
    await context.close();
  }
  for(const width of [375,1440]) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375});
    const fixture=rules.create({seed:42,size:'compact',speed:'normal',cityStateCount:3});
    rules.found(fixture,fixture.units.find(u=>u.owner===0 && u.type==='settler'));
    const city=fixture.cities.find(c=>c.owner===0),at=rules.neighbors(fixture,city.tile)[0],nation=fixture.nations[0];
    fixture.units=fixture.units.filter(u=>u.tile!==at);
    Object.assign(fixture.tiles[at],{terrain:'grass',baseTerrain:'grass',feature:'',hills:false,resource:'',improvement:'',district:'holy',territory:city.id,owner:0});
    city.buildings.push('holy','shrine');nation.tech.push('astrology');nation.faith=25;nation.great.prophet=60;
    assert(saveRules.valid(fixture));
    await context.addInitScript(s=>{if(!localStorage.getItem('aoinatsu:civilization:v3'))localStorage.setItem('aoinatsu:civilization:v3',JSON.stringify(s));},fixture);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
    await page.getByRole('button',{name:'信仰',exact:true}).click();
    await page.getByRole('button',{name:'工匠之神 · 25',exact:true}).click();
    await page.getByRole('button',{name:'招募大预言家',exact:true}).click();
    await page.getByLabel('信徒信条',{exact:true}).selectOption('choral');
    await page.getByLabel('创始人信条',{exact:true}).selectOption('tithe');
    await page.getByRole('button',{name:'信徒信条效果',exact:true}).click();
    assert.match(await page.getByRole('tooltip').innerText(),/祠堂.*文化/);
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'创立宗教',exact:true}).click();await page.waitForTimeout(500);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));
    assert(saveRules.valid(saved));assert.equal(saved.nations[0].faith,0);assert(saved.nations[0].religion);assert.deepEqual(saved.nations[0].beliefs,['choral','tithe']);
    assert.equal(saved.nations[0].greatPeopleEarned,1);assert(!saved.units.some(u=>u.type==='prophet'));assert.equal(saved.cities.find(c=>c.owner===0).religion,0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'religion controls fit mobile');
    assert.equal(await page.getByRole('button',{name:'创立宗教',exact:true}).count(),0,'founding removes obsolete actions');
    assert.equal(await page.getByRole('button',{name:'信徒信条效果',exact:true}).count(),0,'founding removes draft-only help');
    assert.equal(await page.locator('.religion-beliefs > div').count(),2);
    assert((await page.locator('.faith-card').boundingBox()).height<300,'founded religion does not retain blank recruitment space');
    if(process.env.CIV_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`found-religion-${width}.png`),fullPage:true});
    await page.reload();await page.getByRole('button',{name:'信仰',exact:true}).click();
    assert.match(await page.locator('.faith-card').innerText(),/合唱圣歌.*什一税/s);assert.deepEqual(errors,[]);
    console.log(`✓ ${width}px: pantheon, physical prophet, unique beliefs, no extra faith charge and reload`);
    await context.close();
  }
  const gp=await import(moduleUrl('src/games/civilization/great-people.ts'));
  let hypatiaSeed=1;
  while(gp.currentScientist(rules.create({seed:hypatiaSeed})).id!=='hypatia')hypatiaSeed++;
  for(const width of [375,768,1024,1440]) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375});
    const fixture=rules.create({seed:hypatiaSeed,size:'compact',speed:'normal',cityStateCount:3});
    rules.found(fixture,fixture.units.find(u=>u.owner===0&&u.type==='settler'));
    const city=fixture.cities.find(c=>c.owner===0),at=rules.neighbors(fixture,city.tile)[0];
    fixture.units=fixture.units.filter(u=>u.tile!==at);
    Object.assign(fixture.tiles[at],{terrain:'grass',baseTerrain:'grass',feature:'',hills:false,resource:'',improvement:'',district:'campus',territory:city.id,owner:0,pillaged:false});
    city.buildings.push('campus');fixture.nations[0].tech.push('writing');fixture.nations[0].great.science=65;
    assert(saveRules.valid(fixture));
    await context.addInitScript(s=>{if(!localStorage.getItem('aoinatsu:civilization:v3'))localStorage.setItem('aoinatsu:civilization:v3',JSON.stringify(s));},fixture);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
    await page.getByRole('button',{name:'信仰',exact:true}).click();
    assert.match(await page.locator('.scientist-card').innerText(),/希帕蒂娅.*65 \/ 60/s);
    await page.getByRole('button',{name:'科学家能力',exact:true}).click();assert.match(await page.getByRole('tooltip').innerText(),/图书馆.*\+1 科技/);await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const button=page.getByRole('button',{name:'招募科学家',exact:true});assert((await button.boundingBox()).height>=44);
    await button.click();await page.waitForTimeout(350);
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));
    assert(saveRules.valid(saved));assert.equal(saved.nations[0].great.science,5);assert.equal(saved.scientistRecruits[0].person,'hypatia');assert(!saved.cities.find(c=>c.owner===0).buildings.includes('library'),'recruiting is not activation');
    await page.getByRole('button',{name:'城市',exact:true}).click();await page.locator('.unit-roster button').filter({hasText:'希帕蒂娅'}).click();
    await page.locator('.unit-panel').waitFor();assert.match(await page.locator('.unit-panel h2').innerText(),/希帕蒂娅/);
    assert(await page.getByRole('button',{name:'使用能力',exact:true}).isDisabled());
    await page.getByRole('button',{name:'移动',exact:true}).click();
    await page.locator(`[data-tile="${at}"] polygon`).first().click();
    await page.getByRole('button',{name:'使用能力',exact:true}).waitFor();assert(await page.getByRole('button',{name:'使用能力',exact:true}).isEnabled());
    await page.getByRole('button',{name:'科学家能力',exact:true}).click();assert.match(await page.getByRole('tooltip').innerText(),/图书馆/);await page.keyboard.press('Escape');
    if(process.env.CIV_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`scientist-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'使用能力',exact:true}).click();await page.waitForTimeout(350);
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));
    assert(saveRules.valid(saved));assert(saved.cities.find(c=>c.owner===0).buildings.includes('library'));assert.deepEqual(saved.nations[0].scientistEffects,['hypatia']);assert(!saved.units.some(u=>u.person==='hypatia'));
    await page.reload();await page.waitForTimeout(250);const loaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));
    assert.deepEqual(loaded.scientistRecruits,saved.scientistRecruits);assert.deepEqual(loaded.nations[0].scientistEffects,['hypatia']);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
    console.log(`✓ ${width}px: scientist recruitment, named unit, physical movement, actual library activation and reload`);
    await context.close();
  }
  for(const width of (process.env.CIV_TEST_WIDTHS?.split(',').map(Number) ?? [375,768,1024,1440])) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const fixture=rules.create({seed:42,size:'compact',speed:'normal',difficulty:'relaxed'});
    rules.found(fixture,fixture.units.find(u=>u.owner===0&&u.type==='settler'));
    const city=fixture.cities.find(c=>c.owner===0),u=fixture.units.find(u=>u.owner===0&&u.type==='warrior');
    fixture.turn=10;city.buildings.push('walls');city.walls=40;city.lastDamagedTurn=4;city.queue=[];city.food=3;u.moves=1;u.acted=true;u.hp=60;
    assert(saveRules.valid(fixture));
    await context.addInitScript(s=>{if(!localStorage.getItem('aoinatsu:civilization:v3'))localStorage.setItem('aoinatsu:civilization:v3',JSON.stringify(s));},fixture);
    const cityTab=page.locator('.civ-nav').getByRole('button',{name:/^城市\s*\d*$/});
    await page.goto(url);await cityTab.click();await page.getByRole('button',{name:'管理',exact:true}).first().click();
    await page.locator('.city-panel').waitFor();assert.match(await page.locator('.growth').innerText(),/3 \/ 24/);
    assert.match(await page.locator('.city-summary').innerText(),/2 \/ 1/);assert.match(await page.locator('.city-defense-status').innerText(),/补给畅通/);
    const help=page.getByRole('button',{name:'城市增长规则',exact:true});await help.click();assert.match(await page.getByRole('tooltip').innerText(),/住房.*超出5.*停长/s);await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'围城与城墙维修',exact:true}).click();assert.match(await page.getByRole('tooltip').innerText(),/城墙不自动回血.*3回合/s);await page.keyboard.press('Escape');
    await page.getByLabel('生产分类').selectOption('project');
    const repair=page.locator('.build-catalog article').filter({hasText:'修复外部防御'});assert.match(await repair.innerText(),/30 生产/);
    await repair.getByRole('button',{name:'加入队列',exact:true}).click();await page.waitForTimeout(350);
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));assert.equal(saved.cities.find(c=>c.owner===0).queue[0].item,'repairDefenses');assert.equal(saved.cities.find(c=>c.owner===0).walls,40);assert(saveRules.valid(saved));
    if(process.env.CIV_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`growth-repair-${width}.png`),fullPage:true});
    await cityTab.click();await page.locator('.unit-roster button').filter({hasText:'勇士'}).first().click();
    await page.getByRole('button',{name:'驻守',exact:true}).click();await page.waitForTimeout(350);
    await page.reload();await cityTab.click();await page.locator('.unit-roster button').filter({hasText:'勇士'}).first().click();
    await page.getByRole('button',{name:'唤醒',exact:true}).click();await page.waitForTimeout(350);
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));assert.equal(saved.units.find(v=>v.id===u.id).moves,1,'reload/wake must not refill movement');
    assert.match(await page.locator('.unit-rest-status').innerText(),/已行动.*不能休整/);
    await page.getByRole('button',{name:'驻守与休整',exact:true}).click();assert.match(await page.getByRole('tooltip').innerText(),/唤醒不会.*移动力/);const box=await page.getByRole('tooltip').boundingBox();assert(box.x>=0&&box.x+box.width<=width);await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert(saveRules.valid(saved));
    console.log(`✓ ${width}px: growth/amenity numbers, repair queue, tooltips, save/reload and no wake movement exploit`);await context.close();
  }
  for(const width of (process.env.CIV_TEST_WIDTHS?.split(',').map(Number) ?? [375,768,1024,1440])) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const fixture=rules.create({seed:42,size:'compact',speed:'normal',difficulty:'relaxed'});rules.found(fixture,fixture.units.find(u=>u.owner===0&&u.type==='settler'));
    const city=fixture.cities.find(c=>c.owner===0),ns=rules.neighbors(fixture,city.tile),at=ns[0],district=ns[1];
    fixture.units=[];city.queue=[];city.buildings.push('campus','library');fixture.nations[0].tech=['writing','mining','construction'];
    Object.assign(fixture.tiles[at],{terrain:'hill',baseTerrain:'grass',hills:true,feature:'forest',resource:'',district:'',improvement:'',pillaged:false});
    Object.assign(fixture.tiles[district],{terrain:'grass',baseTerrain:'grass',hills:false,feature:'',resource:'',district:'campus',pillaged:true});
    const builder=rules.spawn(fixture,0,'builder',at);assert(saveRules.valid(fixture));
    await page.addInitScript(state=>{if(!localStorage.getItem('aoinatsu:civilization:v3'))localStorage.setItem('aoinatsu:civilization:v3',JSON.stringify(state));},fixture);
    await page.goto(url);const cityTab=page.locator('.civ-nav').getByRole('button',{name:/^城市\s*\d*$/});
    await cityTab.click();await page.getByRole('button',{name:'管理',exact:true}).first().click();
    await page.locator('.inspector-tabs').getByRole('button',{name:'建筑',exact:true}).click();
    const repair=page.getByRole('button',{name:/^修复学院 · \d+生产$/});assert(await repair.isEnabled());await repair.click();await page.waitForTimeout(350);
    await page.getByRole('button',{name:'区域维修',exact:true}).click();assert.match(await page.getByRole('tooltip').innerText(),/建造者.*25%.*单独受损/s);await page.keyboard.press('Escape');
    await page.locator('.inspector-tabs').getByRole('button',{name:'生产',exact:true}).click();assert.match(await page.locator('.production-queue').innerText(),/修复学院/);assert.doesNotMatch(await page.locator('.production-queue').innerText(),/已建成/);
    await page.reload();await cityTab.click();await page.getByRole('button',{name:'管理',exact:true}).first().click();assert.match(await page.locator('.production-queue').innerText(),/修复学院/);
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));assert.equal(saved.cities.find(c=>c.owner===0).queue[0].repair,true);assert(saveRules.valid(saved));
    await cityTab.click();await page.locator('.unit-roster button').filter({hasText:'建造者'}).first().click();
    assert(await page.getByRole('button',{name:'砍伐森林',exact:true}).isEnabled(),'wooded hills must share the actual chop gate');
    const lumber=page.locator('.improvements button').filter({hasText:'伐木场'});assert(await lumber.isEnabled());await lumber.click();await page.waitForTimeout(350);
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));assert.equal(saved.tiles[at].improvement,'lumber');assert.equal(saved.units.find(u=>u.id===builder.id).charges,builder.charges-1);assert(saveRules.valid(saved));
    const help=page.getByRole('button',{name:'建造者操作',exact:true});await help.scrollIntoViewIfNeeded();
    if(width===375) {const touch=await context.newCDPSession(page),box=await help.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.waitForTimeout(650);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();} else await help.click();
    assert.match(await page.getByRole('tooltip').innerText(),/维修和拆除.*不消耗次数/);const tip=await page.getByRole('tooltip').boundingBox();assert(tip.x>=0&&tip.x+tip.width<=width);await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'下一回合',exact:true}).click();const confirm=page.getByRole('button',{name:'直接结束回合',exact:true});if(await confirm.isVisible())await confirm.click();await page.waitForTimeout(350);
    await page.getByRole('button',{name:'拆除改良',exact:true}).click();await page.waitForTimeout(350);saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aoinatsu:civilization:v3')));assert.equal(saved.tiles[at].improvement,'');assert.equal(saved.units.find(u=>u.id===builder.id).charges,builder.charges-1);assert(saveRules.valid(saved));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
    if(process.env.CIV_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.CIV_SCREENSHOT_DIR,`builder-district-${width}.png`),fullPage:true});
    console.log(`✓ ${width}px: district repair queue/reload, wooded-hill builder actions, long-press help and charge-free removal`);await context.close();
  }
} finally {await browser.close();}

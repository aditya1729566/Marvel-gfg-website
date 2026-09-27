import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createMasterTimeline, initialMotion } from "../src/components/journey/timeline";
import { journeyCamera } from "../src/components/journey/state";

test("master score is labeled, reversible and keeps effects in their intended worlds",()=>{
 const motion=initialMotion(),timeline=createMasterTimeline(motion);
 expect(Object.keys(timeline.labels)).toEqual(["intro","hero","iron","repulsor-to-web","spider","web-smash","hulk","strange-gesture","strange-portal","mission","registration"]);
 timeline.time(1.71);expect(motion.blast).toBeCloseTo(1);
 timeline.time(2);expect(motion.blast).toBe(0);expect(motion.web).toBe(1);
 timeline.time(3.96);expect(motion.portal).toBe(1);expect(motion.portalOpen).toBeGreaterThan(.95);
 timeline.time(0);expect(motion.blast).toBe(0);expect(motion.portal).toBe(0);expect(motion.smash).toBe(0);
 expect(motion.strangeGesture).toBe(0);
 for(const mobile of [false,true]){
  expect(journeyCamera(3.61,false,mobile).z).toBe(journeyCamera(3.79,false,mobile).z);
  expect(Math.abs(journeyCamera(3.99999,false,mobile).z-journeyCamera(4,false,mobile).z)).toBeLessThan(.01);
 }
 timeline.kill();
});

test("Strange has a dedicated, reversible portal interval with an accessible skip",async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
 await page.setViewportSize({width:1280,height:900});await page.goto("/#doctor-strange");
 await expect(page.locator(".journey-stage")).toHaveAttribute("data-ready","true",{timeout:60000});
 await expect(page.locator(".experience")).toHaveAttribute("data-passage","strange");
 await expect(page.getByRole("heading",{name:"OPEN A NEW REALITY."})).toBeVisible();
 for(const phase of [.2,.5,.85,.3]){
  await page.evaluate(phase=>{const s=document.getElementById("doctor-strange")!;window.scrollTo({top:s.offsetTop+s.offsetHeight*phase,behavior:"instant"});},phase);
  await expect(page.locator(".experience")).toHaveAttribute("data-passage","strange");
  await expect(page.locator("#hulk .chapter-shell")).not.toBeVisible();
 }
 await page.getByRole("link",{name:"Skip to mission",exact:true}).click();
 await expect(page.locator(".experience")).toHaveAttribute("data-world","4");
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.evaluate(()=>document.getElementById("doctor-strange")!.scrollIntoView({behavior:"instant"}));
 await expect(page.getByRole("link",{name:"Skip to mission",exact:true})).toBeVisible();
 await expect(page.locator("canvas")).toHaveCount(1);
 const accessibility=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
 expect(accessibility.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 await page.emulateMedia({reducedMotion:"no-preference"});
 await expect(page.locator(".experience")).toHaveAttribute("data-reduced","false");
 for(const phase of [.25,.65]){
  await page.evaluate(phase=>{const s=document.getElementById("doctor-strange")!;window.scrollTo({top:s.offsetTop+s.offsetHeight*phase,behavior:"instant"});},phase);
  await expect(page.locator(".experience")).toHaveAttribute("data-passage","strange");
 }
 await page.getByRole("link",{name:"Skip to mission",exact:true}).click();
 await expect(page.locator("#mission")).toHaveAttribute("data-current","true");
 await expect(page.locator(".dossier-header")).toBeVisible();
 expect(errors).toEqual([]);
});

test("portal arrival blends the briefing before the boundary without shifting mobile sections",async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
 await page.emulateMedia({reducedMotion:"no-preference"});
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:1000});
  await page.goto("/#doctor-strange");
  await expect(page.locator(".journey-stage")).toHaveAttribute("data-ready","true",{timeout:60000});
  await expect(page.locator(".experience")).toHaveAttribute("data-reduced","false");
  await expect(page.locator(".experience")).toHaveAttribute("data-passage","strange");
  const offset=await page.locator("#registration").evaluate(el=>(el as HTMLElement).offsetTop);
  let previous=0;
  for(const phase of [.82,.9,.97]){
   const delta=await page.evaluate(phase=>{const s=document.getElementById("doctor-strange")!;return s.offsetTop+s.offsetHeight*phase-window.scrollY;},phase);
   await page.mouse.wheel(0,delta);
   await expect(page.locator("#mission"),`Arrival at ${width}px, phase ${phase}`).toHaveAttribute("data-arriving","true");
   await expect.poll(()=>page.locator("#mission").evaluate(el=>Number((el as HTMLElement).style.getPropertyValue("--copy-opacity")))).toBeGreaterThan(previous);
   const reveal=await page.locator("#mission").evaluate(el=>Number((el as HTMLElement).style.getPropertyValue("--copy-opacity")));
   expect(reveal).toBeGreaterThan(previous);expect(reveal).toBeLessThan(1);previous=reveal;
   expect(await page.locator("#mission .chapter-shell").evaluate(el=>getComputedStyle(el).position)).toBe("fixed");
   expect(await page.locator("#mission .chapter-shell").evaluate(el=>(el as HTMLElement).inert)).toBe(true);
   expect(Math.abs((await page.locator("#registration").evaluate(el=>(el as HTMLElement).offsetTop))-offset)).toBeLessThan(2);
  }
  await page.evaluate(()=>document.getElementById("mission")!.scrollIntoView({behavior:"instant"}));
  await expect(page.locator("#mission")).toHaveAttribute("data-arriving","false");
  await expect(page.locator(".experience")).toHaveAttribute("data-world","4");
  await expect(page.locator(".dossier-header")).toBeVisible();
 }
 await page.emulateMedia({reducedMotion:"reduce"});
 await expect(page.locator(".experience")).toHaveAttribute("data-reduced","true");
 const reducedDelta=await page.evaluate(()=>{const s=document.getElementById("doctor-strange")!;return s.offsetTop+s.offsetHeight*.97-window.scrollY;});
 await page.mouse.wheel(0,reducedDelta);
 await expect(page.locator(".experience")).toHaveAttribute("data-passage","strange");
 await expect(page.locator("#mission")).toHaveAttribute("data-arriving","false");
 await page.getByRole("link",{name:"Skip to mission",exact:true}).click();
 expect(await page.locator("#mission .chapter-shell").evaluate(el=>getComputedStyle(el).opacity)).toBe("1");
 expect(errors).toEqual([]);
});

test("cinematic connectors scrub at five points with no overlapping fixed copy or shader errors",async({page})=>{
 test.setTimeout(180000);
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
 await page.setViewportSize({width:1280,height:900});await page.goto("/");
 await expect(page.locator(".journey-stage")).toHaveAttribute("data-ready","true",{timeout:45000});
 for(const [i,id] of ["top","iron-man","spider-man","hulk"].entries()){
  for(const [n,phase] of [.5,.625,.75,.875,.999].entries()){
   await page.evaluate(({id,phase})=>{const section=document.getElementById(id)!;window.scrollTo({top:section.offsetTop+section.offsetHeight*phase,behavior:"instant"});},{id,phase});
   await expect(page.locator(".experience")).toHaveAttribute("data-world",String(i));
   await page.waitForTimeout(200);
   const fixedVisible=await page.locator(".chapter-shell").evaluateAll(shells=>shells.filter(el=>{const s=getComputedStyle(el);return s.position==="fixed"&&s.visibility==="visible"&&Number(s.opacity)>.01;}).length);
   expect(fixedVisible).toBeLessThanOrEqual(1);
   await page.screenshot({path:`../cinematic-${id}-${n*25}.png`});
  }
 }
 await page.evaluate(()=>{const s=document.getElementById("hulk")!;window.scrollTo({top:s.offsetTop+s.offsetHeight*.68,behavior:"instant"});});
 await page.waitForTimeout(250);await page.screenshot({path:"../cinematic-strange-portal.png"});
 expect(errors).toEqual([]);await expect(page.locator("canvas")).toHaveCount(1);
});

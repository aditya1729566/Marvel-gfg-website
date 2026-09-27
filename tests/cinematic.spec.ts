import { test, expect } from "@playwright/test";
import { createMasterTimeline, initialMotion } from "../src/components/journey/timeline";

test("master score is labeled, reversible and keeps effects in their intended worlds",()=>{
 const motion=initialMotion(),timeline=createMasterTimeline(motion);
 expect(Object.keys(timeline.labels)).toEqual(["intro","hero","iron","repulsor-to-web","spider","web-smash","hulk","strange-portal","mission","registration"]);
 timeline.time(1.71);expect(motion.blast).toBeCloseTo(1);
 timeline.time(2);expect(motion.blast).toBe(0);expect(motion.web).toBe(1);
 timeline.time(3.9);expect(motion.portal).toBe(1);expect(motion.portalOpen).toBeGreaterThan(.95);
 timeline.time(0);expect(motion.blast).toBe(0);expect(motion.portal).toBe(0);expect(motion.smash).toBe(0);
 timeline.kill();
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

import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { readFileSync } from "node:fs";
import { armorParts, armorTransform, evaluateArmorTransform, fallbackArmorGeometry, assemblyClock, advanceAssembly } from "../src/components/journey/armor";

test("assembly timing is wall-clock based and reverses without a frame-rate-dependent delay",()=>{
 const clock=assemblyClock();
 expect(advanceAssembly(clock,1,100,false)).toBe(0);
 expect(advanceAssembly(clock,1,900,false)).toBeCloseTo(.5);
 expect(advanceAssembly(clock,0,900,false)).toBeCloseTo(.5);
 expect(advanceAssembly(clock,0,1300,false)).toBeCloseTo(.25);
 expect(advanceAssembly(clock,0,1700,false)).toBe(0);
 expect(advanceAssembly(clock,1,1701,true)).toBe(1);
});

test("production GLB contains the measured geometry and all twenty explicit controls",()=>{
 const binary=readFileSync("public/models/iron-man.glb");
 const json=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString("utf8"));
 expect(json.meshes).toHaveLength(102);expect(json.skins??[]).toHaveLength(0);expect(json.images??[]).toHaveLength(0);
 const controls=json.nodes.filter((node:{extras?:{armor_control?:boolean}})=>node.extras?.armor_control);
 expect(controls.map((node:{extras:{armor_part:string}})=>node.extras.armor_part).sort()).toEqual(armorParts.map(part=>part.id).sort());
 for(const mesh of json.meshes)for(const primitive of mesh.primitives)expect(primitive.attributes.NORMAL).toBeDefined();
});

test("armor roles preserve independent assembled/exploded transforms and reverse exactly",()=>{
 expect(armorParts).toHaveLength(20);
 const home=new THREE.Vector3(1,2,3), rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(.1,.2,.3));
 const part=armorTransform("helmet",home,rotation,new THREE.Vector3(2,1,1),new THREE.Euler(.2,-.1,.05));
 const position=new THREE.Vector3(), quaternion=new THREE.Quaternion();
 evaluateArmorTransform(part,1,position,quaternion);expect(position.toArray()).toEqual([3,3,4]);
 evaluateArmorTransform(part,0,position,quaternion);expect(position.toArray()).toEqual(home.toArray());expect(quaternion.toArray()).toEqual(rotation.toArray());
 expect(home.toArray()).toEqual([1,2,3]);expect(part.assembledPosition).not.toBe(home);
});

test("fallback UV cells tile the source once without overlapping rectangles",()=>{
 let area=0;
 armorParts.filter(part=>part.visible).forEach((_,index)=>{
  const {geometry}=fallbackArmorGeometry(index,8,446/686), uv=geometry.getAttribute("uv");
  for(let i=0;i<uv.count;i+=3){const ax=uv.getX(i),ay=uv.getY(i),bx=uv.getX(i+1),by=uv.getY(i+1),cx=uv.getX(i+2),cy=uv.getY(i+2);area+=Math.abs((bx-ax)*(cy-ay)-(by-ay)*(cx-ax))/2;}
  geometry.dispose();
 });
 expect(area).toBeCloseTo(1,5);
});

test("armor study supports keyboard selection, isolation, rotation and reassembly",async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
 await page.setViewportSize({width:1280,height:900});await page.goto("/#iron-man");
 await expect(page.locator(".journey-stage")).toHaveAttribute("data-ready","true",{timeout:45000});
 await page.getByRole("group",{name:"Interactive Iron Man suit"}).focus();await page.keyboard.press("Enter");
 await page.getByLabel("Inspect a component").selectOption("faceplate");
 await expect(page.locator("#iron-man")).toHaveAttribute("data-selected-part","faceplate");
 await page.getByRole("group",{name:"Interactive Iron Man suit"}).focus();await page.keyboard.press("ArrowLeft");
 await page.keyboard.press("Escape");await expect(page.locator("#iron-man")).toHaveAttribute("data-selected-part","");
 await page.keyboard.press("Escape");await expect(page.locator("#iron-man")).toHaveAttribute("data-inspecting","false");
 await expect(page.getByRole("button",{name:/Rotate assembly|Toggle isolation|Open armor/})).toHaveCount(0);
 await expect(page.locator("canvas")).toHaveCount(1);expect(errors).toEqual([]);
});

test("the actual suit supports one-click disassembly, part picking, cursor rotation and empty-space return",async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:"reduce"});
 await page.goto("/#iron-man");await expect(page.locator(".journey-stage")).toHaveAttribute("data-ready","true",{timeout:45000});
 await page.waitForTimeout(500);await page.mouse.click(1040,350);
 await expect(page.locator("#iron-man")).toHaveAttribute("data-inspecting","true");
 await page.waitForTimeout(700);await page.screenshot();await page.mouse.click(970,210);
 await expect(page.locator("#iron-man")).toHaveAttribute("data-selected-part","chest_plate");
 await page.waitForTimeout(500);const before=await page.screenshot();
 await page.mouse.move(1060,500);await page.mouse.down();await page.mouse.move(1150,540,{steps:8});await page.mouse.up();
 await page.waitForTimeout(300);expect((await page.screenshot()).equals(before)).toBe(false);
 await expect(page.locator("#iron-man")).toHaveAttribute("data-selected-part","chest_plate");
 await page.mouse.click(700,730);await expect(page.locator("#iron-man")).toHaveAttribute("data-selected-part","");
 await page.mouse.click(700,730);await expect(page.locator("#iron-man")).toHaveAttribute("data-inspecting","false");
 expect(errors).toEqual([]);
});

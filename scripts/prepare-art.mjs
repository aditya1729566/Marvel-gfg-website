import sharp from "sharp";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const supplied = "/var/folders/cw/wz90vx912374j7qqv5l61lm40000gn/T";
const generated = "/Users/adityaagrawal/.codex/generated_images/01a0e176-22b6-7c83-bf8c-65cbcd9c34b0";
const inputs = {
 iron: path.join(supplied,"codex-clipboard-56e42b72-5ce9-4a8f-b85d-34470d56e8e0.png"),
 spider: path.join(supplied,"codex-clipboard-50ac2695-bb32-431e-8df2-55e3e950eae5.png"),
 hulk: path.join(supplied,"codex-clipboard-b5027283-c0cb-4bc5-bb3c-16520f92ddd6.png"),
 strange: path.join(supplied,"codex-clipboard-b989e6d7-80db-45b8-93a0-2707c8808f8e.png"),
 lab: path.join(generated,"exec-b70d94a6-5c27-411b-adcd-92f00e8e84b8.png"),
 city: path.join(generated,"exec-287991d5-5570-4db7-8d17-d79636922c5d.png"),
 ruins: path.join(generated,"exec-6c2c6a2d-c107-482b-b867-05a203b2ce57.png"),
};
await mkdir(path.join(root,"public/art"),{recursive:true});
await mkdir(path.join(root,"asset-sources"),{recursive:true});
for (const [name,input] of Object.entries(inputs)) {
 await copyFile(input,path.join(root,"asset-sources",`${name}.png`));
 const metadata=await sharp(input).metadata();
 for (const [suffix,width] of [["",1920],["-mobile",960]]) {
  await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toFile(path.join(root,"public/art",`${name}${suffix}.webp`));
 }
 console.log(`${name}: ${metadata.width} × ${metadata.height}; source preserved, WebP encoded without enlargement`);
}

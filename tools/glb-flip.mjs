// Turn a .glb's whole scene 180 degrees about z (blade-up): Meshy sends the set swords tip-down. node tools/glb-flip.mjs in.glb out.glb
import fs from "fs"; const [SRC,OUT]=process.argv.slice(2);
const b=fs.readFileSync(SRC); const jl=b.readUInt32LE(12); const J=JSON.parse(b.slice(20,20+jl).toString()); const rest=b.slice(20+jl);
const sc=J.scenes[J.scene||0], top=J.nodes.length; J.nodes.push({ name:'flip', rotation:[0,0,1,0], children:sc.nodes.slice() }); sc.nodes=[top];
let js=Buffer.from(JSON.stringify(J)); js=Buffer.concat([js,Buffer.alloc((4-js.length%4)%4,0x20)]); const head=Buffer.alloc(12); head.writeUInt32LE(0x46546c67,0); head.writeUInt32LE(2,4); head.writeUInt32LE(12+8+js.length+rest.length,8); const jh=Buffer.alloc(8); jh.writeUInt32LE(js.length,0); jh.writeUInt32LE(0x4e4f534a,4);
fs.writeFileSync(OUT,Buffer.concat([head,jh,js,rest])); console.log(OUT+' flipped blade-up');

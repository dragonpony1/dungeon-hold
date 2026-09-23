// print a GLB's nodes (with mesh/skin flags), meshes, skins and animations — run on any new Meshy export first
import fs from "fs";
for(const f of process.argv.slice(2)){ const b=fs.readFileSync(f); const jl=b.readUInt32LE(12); const j=JSON.parse(b.slice(20,20+jl).toString()); const nodes=j.nodes||[], meshes=j.meshes||[], skins=j.skins||[], anims=j.animations||[], acc=j.accessors||[];
  const dur=a=>{ let m=0; for(const s of a.samplers){ const ac=acc[s.input]; if(ac&&ac.max) m=Math.max(m,ac.max[0]); } return m.toFixed(2); };
  console.log("== "+f+"  nodes "+nodes.length+"  meshes "+meshes.length+"  skins "+skins.length+"  anims "+anims.length+"  images "+(j.images||[]).length);
  console.log("  meshes: "+meshes.map(m=>(m.name||"?")+"["+m.primitives.length+"p"+(m.primitives[0].attributes.JOINTS_0!==undefined?",skinned":"")+"]").join(", "));
  console.log("  skins: "+skins.map(s=>(s.name||"?")+" joints "+s.joints.length).join(", "));
  console.log("  anims: "+anims.map(a=>(a.name||"?")+" "+dur(a)+"s ch"+a.channels.length).join(", "));
  const named=nodes.map((n,i)=>n.name||("#"+i)); console.log("  nodes: "+named.filter(n=>!/^#/.test(n)).slice(0,60).join(", ")); }

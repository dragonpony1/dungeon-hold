// ===== PET ANIMATION (build 244). Matt: "i want each of these familiars to have some animation going on, in most cases wings that beat but something otherwise they just look like still pictures floating there".
// The Meshy pets are single static meshes (no rig, no clips), so they are animated in their VERTEX SHADER: a wing beat (every vertex far enough out to the side is rotated about the body's front-to-back
// axis, more the further out it is, opposite ways for the two sides so both wings rise and fall together), a slow sway that grows toward the top of the body (a fox's brush, a stag's antlers, the hydra's
// heads, an owl's ruffle), and a breath (a 2% swell). Nothing in the model files changes; the ink outline's shell gets the same displacement so the outline moves with it.
// Matt, next: "just one or two rig points per familiar, for the owl maybe its his eyes that blink or head that turns" -- so each pet gets one or two moving parts on top of the breath: wings (drake, imp, bat, sprite, wisp,
// owl), a TAIL that swishes (wisp, imp, bat), and for the Crystal Owl its HEAD that looks side to side and its EYES that blink (the eye patches squash flat every three seconds).
// Matt, then: "the bat and owl animations are.. off. take it off the owls wings all together and just do head turns slowly, and on the bat maybe smaller faster throws, or move the rigging" -- so the owls
// (Crystal Owl, Old Lamplight) have NO wing beat at all, only a slow smooth head turn; the bat's wings beat smaller (.2 rad) and faster (28), pivot at the SHOULDER instead of the body's middle (pv), and the
// ears above the wing line are left out of the beat (top) -- before, the wing turn dragged the ears round and the whole head tumbled.
// One patch per material (shared by every clone, so a teammate's pet on your screen beats too); the time is one shared uniform (PET_T). Per-pet numbers: PET_CFG below.
(function(){
const PET_T={value:0}; let HOLD=false;
const KIND_CFG={   // amp: wing-beat angle (rad), spd: beats per second x 2pi, inn/out: how far out (fraction of the half-width) the wing starts / is full, root: height of the wing roots (fraction of the height), sway: 0..1.5
  'Storm Drake':{amp:.3,spd:8,inn:.3,out:.65,root:.6,sway:.12,tail:.9,pv:.2,top:.9},   // build 248, Matt's new drake: the wings beat about the shoulders, the head and horns (above 'top') and the body stay put, the hanging tail swishes
  'Fire Imp':{amp:.4,spd:15,inn:.34,out:.72,root:.5,sway:.2,tail:.9},
  'Bat':{amp:.2,spd:28,inn:.16,out:.5,root:.52,sway:.08,tail:.6,pv:.16,top:.64},   // smaller, faster; pivot at the shoulder; the ears (above 'top') stay put
  'Sprite':{amp:.45,spd:26,inn:.14,out:.5,root:.6,sway:.3},
  'Crystal Owl':{amp:0,head:{from:.66,amp:.6,spd:.42}},   // the crystal owl: no wings, only a slow head turn
  'Wisp':{amp:.35,spd:13,inn:.22,out:.6,root:.6,sway:.45,tail:1.1}};
const NAMED_CFG={
  bramblewhisk:{amp:0,sway:1},                                   // the thorny fox: the brush and the crest sway
  old_lamplight:{amp:0,head:{from:.62,amp:.55,spd:.42}},         // the lantern owl: no wings, only a slow head turn
  gladehart:{amp:0,sway:.8},                                     // the stag: antlers and mane
  trimaw:{amp:0,sway:1.3}};                                      // the hydra: its three heads weave
const f=n=>{ const t=Number(n).toFixed(5); return n<0?'('+t+')':t; };   // a negative literal is wrapped: 'P.y-' + '-1.0' would read as the decrement operator
function glslFor(c,geo){ if(!geo.boundingBox) geo.computeBoundingBox(); const b=geo.boundingBox, half=Math.max(Math.abs(b.min.x),Math.abs(b.max.x),1e-4), H=Math.max(1e-4,b.max.y-b.min.y), CY=b.min.y+(c.root||.55)*H;
  let s='uniform float uPetT;\nvec3 petDisp(vec3 P){\n';
  if(c.amp){ const pv=(c.pv||0)*half, hm=c.top?'(1.0-smoothstep('+f(b.min.y+(c.top-.05)*H)+','+f(b.min.y+c.top*H)+',P.y))':'1.0';   // pv: the wing's pivot out from the middle (the shoulder); top: the height above which nothing beats (the ears)
    s+='  { float ax=abs(P.x); float sd=P.x<0.0?-1.0:1.0; float k=smoothstep('+f(c.inn*half)+','+f(c.out*half)+',ax)*'+hm+'; float a=sd*'+f(c.amp)+'*k*sin(uPetT*'+f(c.spd)+'); float cs=cos(a), sn=sin(a); vec2 q=vec2(P.x-sd*'+f(pv)+',P.y-'+f(CY)+'); P.x=q.x*cs-q.y*sn+sd*'+f(pv)+'; P.y=q.x*sn+q.y*cs+'+f(CY)+'; }\n'; }
  if(c.sway) s+='  { float h=clamp((P.y-'+f(b.min.y)+')/'+f(H)+',0.0,1.0); float w=smoothstep(0.3,1.0,h); P.x+='+f(c.sway*H*.035)+'*sin(uPetT*2.4+P.y*'+f(6/H)+')*w; P.z+='+f(c.sway*H*.025)+'*cos(uPetT*1.9+P.y*'+f(5/H)+')*w; }\n';
  if(c.tail) s+='  { float h=clamp((P.y-'+f(b.min.y)+')/'+f(H)+',0.0,1.0); float wt=smoothstep(0.34,0.0,h); P.x+='+f(c.tail*H*.06)+'*sin(uPetT*3.1+h*5.0)*wt; }\n';
  if(c.head){ const zc=(b.min.z+b.max.z)/2; s+='  { float hh=(P.y-'+f(b.min.y)+')/'+f(H)+'; float wg=smoothstep('+f(c.head.from)+','+f(c.head.from+.06)+',hh); float ph=sin(uPetT*'+f(c.head.spd||.55)+'); float ang='+f(c.head.amp)+'*ph*wg; float cs=cos(ang), sn=sin(ang); vec2 d=vec2(P.x,P.z-'+f(zc)+'); P.x=d.x*cs-d.y*sn; P.z=d.x*sn+d.y*cs+'+f(zc)+'; }\n'; }
  if(c.eye){ const zc=(b.min.z+b.max.z)/2, ex=c.eye.x*half, ey=b.min.y+c.eye.y*H, er=c.eye.r*H; s+='  { float bk=pow(max(0.0,sin(uPetT*2.1)),40.0); float d=length(vec2(abs(P.x)-'+f(ex)+',P.y-'+f(ey)+')); float w=smoothstep('+f(er)+','+f(er*.45)+',d)*step('+f(zc)+',P.z); P.y=mix(P.y,'+f(ey)+',bk*w*0.9); }\n'; }
  s+='  P*=1.0+0.018*sin(uPetT*2.1);\n  return P;\n}\n'; return s; }
function patch(mat,glsl,key){ if(!mat||mat.__petAnim) return; mat.__petAnim=true; const prevKey=mat.customProgramCacheKey?mat.customProgramCacheKey():''; mat.customProgramCacheKey=()=>'pet:'+key+':'+glsl.length+':'+prevKey; const prev=mat.onBeforeCompile;
  mat.onBeforeCompile=sh=>{ if(prev) prev(sh); sh.uniforms.uPetT=PET_T; let v=sh.vertexShader;
    v=v.replace(/void main\s*\(\s*\)\s*\{/,glsl+'\nvoid main(){');
    if(v.includes('vec3 p=position+normal*t;')) v=v.replace('vec3 p=position+normal*t;','vec3 p=petDisp(position)+normal*t;');   // the ink outline's shell
    else v=v.replace('#include <begin_vertex>','#include <begin_vertex>\n  transformed=petDisp(transformed);');
    sh.vertexShader=v; }; mat.needsUpdate=true; }
function animate(root){ const u=root.userData; const cfg=u.named?NAMED_CFG[u.named]:KIND_CFG[u.kind]; if(!cfg) return; const key=u.named||u.kind;
  root.traverse(m=>{ if(!m.isMesh||!m.geometry) return; const g=glslFor(cfg,m.geometry); for(const mt of Array.isArray(m.material)?m.material:[m.material]) patch(mt,g,key); });
  u.animated=true; }
{ const prev=famModel; famModel=function(it){ const root=prev.apply(this,arguments); if(root&&root.userData&&root.userData.glb&&!root.userData.animated) animate(root); return root; }; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(!HOLD) PET_T.value=performance.now()/1000; }; }
window.__petanim={glsl:(k,geo)=>glslFor(KIND_CFG[k],geo),time:()=>PET_T.value,hold:t=>{ HOLD=true; PET_T.value=t; },release:()=>{ HOLD=false; },cfg:KIND_CFG,named:NAMED_CFG};
})();

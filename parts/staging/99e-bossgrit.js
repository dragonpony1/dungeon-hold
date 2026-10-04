// ===== BOSSES ARE NOT SHOVED (build 253). Matt: "bosses getting staggered" / "the shove back prevents the boss from advancing and attacking structures". Every hit in the game passes a knockback to hurt(e,dmg,kx,kz) (a sword swing, an arrow, the
// Knight's whirlwind, a set's wind, the Gladehart's charge), which moves the mob back by half of it; a boss hit again and again was pushed back as fast as it could walk forward and never reached the towers. A boss now takes the
// damage but none of the shove. Ordinary mobs are pushed as before. Loaded last so it sees every hit first (a co-op guest's hit reaches the host's hurt() the same way). Test hook: window.__bossgrit.
// Build 532 prep (Matt, of Sir Bullion: "he kinds has the same knock back issue a lot of the bosses have, where he gets hit then doest do his attack"), measured in bossattack-test.mjs:
//   * NO FLINCH: every hit squashed a boss's model flat (game.js hurt() sets e.squash=1: 35% shorter, 25% wider, gone in .14 s). Hit by an auto-firing, dual-wielding hero, his pets and the towers it never
//     came back up -- the boss looked knocked about the whole fight and its own swing was squashed out of shape. A boss's model now keeps its shape (the Archhag already did, 95f). The damage numbers still float, and
//     e.squash itself still marks it "just hit" (Old Lamplight's pet picks a just-hit mob by it, 97-mythics.js) -- only the look is dropped.
//   * A BOSS FIGHTS BACK: a mob only notices a hero standing within its own body plus 1.1 (game.js nearestHero), but a hero's sword reaches its body plus 2.4 (plus 40% with the Wind set). A Knight hacking at
//     Sir Bullion from behind, 3 away, was never swung at once in 15 s: he walked on with his back to him (from 1.9 in front: six punches). A melee boss now notices a hero close enough to hit it (its body plus BOSS_SEE), steps in and swings; the blow
//     still lands only on a hero still in reach when it lands (build 289), so stepping back still dodges it. Ranged bosses and flyers keep their own ways.
//   * The Corruptor of Fate is a boss here too (the other boss lists -- 95o, 95p, 96l, 96o, 97g -- already count it); it was shoved by every hit.
//   * The Wind set's GALE shove (93b-sets8.js, and a co-op guest's in 99-network.js) moved mobs itself, around hurt(), so it threw bosses 2.7 units a swing; it now asks window.__bossgrit.is(e) and leaves them.
(function(){
const BOSSES=new Set(['cyclops','pigflail','pigdagger','pigsling','trollboss','archhag','avery','bullion','corruptor']);   /* build 529 prep: Sir Bullion (95v) too; build 532 prep: the Corruptor (95k) */   // the same five the Gladehart and the named-mythic drop already treat as bosses (85-familiars.js SC_BOSS, 87-mythicdrops.js MOB_BOSS)
const BOSS_SEE=3.4;   // how far past its own body a melee boss notices a hero: a sword's 2.4, and the Wind set's 40% on top
const isBoss=e=>!!(e&&BOSSES.has(e.kind));
let SHOVES=0, FLINCHES=0, SEEN=0;
{ const prev=hurt; hurt=function(e,dmg,kx,kz){ if(isBoss(e)&&(kx||kz)){ SHOVES++; arguments[2]=0; arguments[3]=0; } return prev.apply(this,arguments); }; }
{ const prev=updateEnemies; updateEnemies=function(dt){ const r=prev.apply(this,arguments);   // game.js drew the squash into the model's scale; a boss is redrawn at its own size
    for(const e of enemies){ if(e.dead||!(e.squash>0)||!isBoss(e)||!e.mdl||!e.mdl.g) continue; e.mdl.g.scale.setScalar(e.sc*(e.pop<1?easeOutBack(e.pop):1)); FLINCHES++; } return r; }; }
{ const prev=nearestHero; nearestHero=function(e,extra){ const near=prev.apply(this,arguments); if(near||!isBoss(e)||e.ranged||e.fly||e.dead) return near;
    let best=null, bd=e.r+BOSS_SEE; const look=h=>{ if(h.isDead()) return; const d=Math.hypot(h.x-e.x,h.z-e.z); if(d<bd&&(h.y||0)-(e.y||0)<1.4){ best=h; bd=d; } };   // the same height rule as nearestHero's own
    if(hero.dead<=0) look({ x:hero.x, y:hero.y, z:hero.z, isDead:()=>hero.dead>0, hurt:hurtHero }); for(const h of (extra||[])) look(h);
    if(best) SEEN++; return best; }; }
window.__bossgrit={kinds:()=>[...BOSSES],is:isBoss,see:BOSS_SEE,shoved:()=>SHOVES,flinches:()=>FLINCHES,seen:()=>SEEN,hurt:(e,d,kx,kz)=>hurt(e,d,kx,kz)};
})();

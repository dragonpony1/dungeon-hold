// ===== BOSSES ARE NOT SHOVED (build 253). Matt: "bosses getting staggered" / "the shove back prevents the boss from advancing and attacking structures". Every hit in the game passes a knockback to hurt(e,dmg,kx,kz) (a sword swing, an arrow, the
// Knight's whirlwind, a set's wind, the Gladehart's charge), which moves the mob back by half of it; a boss hit again and again was pushed back as fast as it could walk forward and never reached the towers. A boss now takes the
// damage and the hit-squash but none of the shove. Ordinary mobs are pushed as before. Loaded last so it sees every hit first (a co-op guest's hit reaches the host's hurt() the same way). Test hook: window.__bossgrit.
(function(){
const BOSSES=new Set(['cyclops','pigflail','pigdagger','pigsling','trollboss','archhag','avery','bullion']);   /* build 529 prep: Sir Bullion (95v) too */   // the same five the Gladehart and the named-mythic drop already treat as bosses (85-familiars.js SC_BOSS, 87-mythicdrops.js MOB_BOSS)
let SHOVES=0;
{ const prev=hurt; hurt=function(e,dmg,kx,kz){ if(e&&BOSSES.has(e.kind)&&(kx||kz)){ SHOVES++; arguments[2]=0; arguments[3]=0; } return prev.apply(this,arguments); }; }
window.__bossgrit={kinds:()=>[...BOSSES],shoved:()=>SHOVES,hurt:(e,d,kx,kz)=>hurt(e,d,kx,kz)};
})();

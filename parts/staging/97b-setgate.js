// ===== WHICH SETS CAN DROP WHERE (build 240). Matt, 2026-09-29: "in room 1 only nature/forest set pieces can drop, in room two only forest or Arcane sets can
// drop the others can't until wave 7 of the throne room, then any set can drop during the round on regular mobs, on wave 7 the end drop or the reward drop if you
// will can be any piece at a rate of 80%".
//   stage 0  the training hall (map one, and the tutorial):   only the FOREST set
//   stage 1  the Throne Room (map two), waves 1-6:            the FOREST set and the ARCANE set (the Void -- 93-gearsets.js calls it "the arcane Void set")
//   stage 2  the Throne Room from wave 7, and every later room: every set
// Two things drop set pieces and both are gated: (1) the set PACKS (Forest, Void and the other eight, 93-gearsets.js / 93b-sets8.js: after the ordinary roll a
// Rare-or-better piece may become a set piece) -- each pack's chance() is 0 while its set is shut; (2) the MYTHIC set pieces (87-mythicdrops.js) -- their pool of
// sets is narrowed the same way (87 asks window.__setGate.mythic(id)); the hall's pool is empty, so nothing mythicizes there. Named mythics are not sets and are
// untouched. And the wave-7 reward: in the Throne Room's last campaign wave the reward drop (game.js waveRewardItem) becomes a mythic set piece 80% of the time --
// any slot, any of the nine sets. Guests re-roll a drop on their own page at the host's wave (99-network.js atHallWave), so the gate reads S.wave like everything else.
(function(){
const FOREST='of the Forest', ARCANE='of the Void';
const TAIL={void:'of the Void',crimson:'of Chaos',rock:'of the Earth',lava:'of Fire',angelic:'of Radiance',storm:'of the Storm',shadow:'of Shadow',ice:'of Ice',wind:'of the Wind'};
const REWARD_CHANCE=.8;   // wave 7 of the Throne Room: the reward drop is a set piece this often
function stageFor(mapi,wave,tutorial){ if(tutorial||mapi===0) return 0; if(mapi===1&&(wave|0)<7) return 1; return 2; }
const stage=()=>stageFor(MAPI,S.wave,TUTORIAL);
const allowedFor=(n,st)=>st>=2||(st===1&&(n===FOREST||n===ARCANE))||(st===0&&n===FOREST);
const OFF=Q.has('nosetgate');   // ?nosetgate: the old ungated rules (the suites that measure the set formulas themselves open the game this way)
const allowed=n=>OFF||allowedFor(n,stage());
for(const n of Meta.packs.list()){ const P=Meta.packs.get(n); if(!P||P.__gated) continue; P.__gated=true; const orig=P.chance; P.chance=w=>allowed(n)?orig(w):0; }
// the wave-7 reward
{ const prev=waveRewardItem; waveRewardItem=function(){ const it=prev.apply(this,arguments);
    if(!OFF&&!TUTORIAL&&MAPI===1&&!SURVIVAL&&S.wave===7&&LR()<REWARD_CHANCE){ const M=window.__mythicDrops; if(M&&M.eligible(it)){ M.mythicize(it); it.__announce=true; } }
    return it; }; }
window.__setGate={stage,stageFor,allowed,allowedFor,mythic:id=>allowed(TAIL[id]||id),isSet:it=>!!(it&&(it.mythic||(Meta.packs&&Meta.packs.of(it)))),names:()=>Meta.packs.list(),tail:TAIL,rewardChance:REWARD_CHANCE,reward:()=>waveRewardItem()};
})();

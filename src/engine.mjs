// Battle Master deterministic rules, independent of UI.
const defs={
  "levy": [
    "Levy",
    "levy",
    1,
    1,
    0,
    2
  ],
  "sword1": [
    "Swordsman",
    "sword",
    2,
    2,
    0,
    4
  ],
  "sword2": [
    "Long Swordsman",
    "sword",
    3,
    3,
    0,
    4
  ],
  "sword3": [
    "Royal Guard",
    "sword",
    4,
    3,
    1,
    5
  ],
  "sword4": [
    "Elite Guard",
    "sword",
    5,
    4,
    2,
    6
  ],
  "spear1": [
    "Spearman",
    "spear",
    2,
    2,
    0,
    3
  ],
  "spear2": [
    "Long Spearman",
    "spear",
    3,
    2,
    0,
    5
  ],
  "spear3": [
    "Pike Warden",
    "spear",
    4,
    3,
    1,
    5
  ],
  "spear4": [
    "Banner Pike",
    "spear",
    5,
    3,
    2,
    6
  ],
  "rider1": [
    "Light Rider",
    "rider",
    2,
    2,
    0,
    3
  ],
  "rider2": [
    "Ford Lancer",
    "rider",
    3,
    3,
    0,
    3
  ],
  "rider3": [
    "Pennant Rider",
    "rider",
    4,
    3,
    1,
    4
  ],
  "rider4": [
    "Storm Lancer",
    "rider",
    5,
    4,
    1,
    5
  ],
  "bow1": [
    "Archer",
    "bow",
    2,
    2,
    0,
    3
  ],
  "bow2": [
    "Yew Bowman",
    "bow",
    3,
    3,
    0,
    3
  ],
  "bow3": [
    "Ridge Marksman",
    "bow",
    4,
    3,
    0,
    4
  ],
  "bow4": [
    "Beacon Longbow",
    "bow",
    5,
    4,
    1,
    4
  ]
};
const tactics={
  "watch": "Change the Watch",
  "stitch": "Field Stitcher",
  "screen": "Wicker Screens",
  "courier": "Quick Courier"
};
function startRound(s){s.phase="muster";s.pending=null;s.orders=[null,null];s.turn=s.priority;for(const p of s.players){p.supply=Math.min(6,p.supply+3);p.passed=false;p.repositioned=false;draw(p,s.round===1?4:1)}let i=s.players.findIndex(p=>p.hand.length>7);if(i>=0){s.pending={side:i,kind:"discard",roundStart:true};s.phase="choice"}}
function apply(s,i,a){if(!legal(s,i).some(b=>Object.keys(b).length===Object.keys(a).length&&Object.keys(b).every(k=>b[k]===a[k])))throw Error("Illegal action");let p=s.players[i],l=p.lanes[a.lane];if(s.phase==="choice"){let [id]=p.hand.splice(a.h,1);if(a.type==="bottom")p.deck.push(id);else p.discard.push(id);if(p.hand.length>7){s.pending.kind="discard";return}let roundStart=s.pending.roundStart;s.pending=null;if(roundStart){let j=s.players.findIndex(q=>q.hand.length>7);if(j>=0){s.pending={side:j,kind:"discard",roundStart:true};s.phase="choice"}else{s.phase="muster";s.turn=s.priority}}else advance(s,i);return}if(a.type==="pass")p.passed=true;else if(a.type==="move"){p.supply-=l[0].family==="rider"?0:1;l[0].moved=true;p.lanes[1-a.lane]=l;p.lanes[a.lane]=[null,null];p.repositioned=true}else{let [id]=p.hand.splice(a.h,1);if(a.type==="deploy"){let u=unit(id);p.supply-=u.cost;l[a.slot]=u}else{p.supply--;p.discard.push(id);if(a.type==="watch") { [l[0],l[1]]=[l[1],l[0]] }if(a.type==="screen")l[0].guard++;if(a.type==="stitch")l[a.slot].hp=Math.min(l[a.slot].maxHp,l[a.slot].hp+2);if(a.type==="courier"){draw(p,2);s.pending={side:i,kind:"bottom"};s.phase="choice";return}}}s.log.push(`${i===0?"You":"Rival"}: ${a.type}${a.lane===undefined?"":" "+["Road","Ridge"][a.lane]}`);advance(s,i)}
function unit(id,stars=1){const [name,family,cost,atk,def,hp]=defs[id];return {id,name,family,cost,form:family==="levy"?1:cost-1,stars,atk:atk+(stars>=2?1:0),def:def+(stars===3?1:0),hp:hp+stars-1,maxHp:hp+stars-1,guard:0,moved:false}}
function deck(families){return [...families.map(f=>f+"1"),"levy","levy"].flatMap(id=>Array(3).fill(id)).concat(Object.keys(tactics).flatMap(id=>[id,id]))}
function shuffle(cards,seed){let x=seed>>>0;let out=[...cards];for(let i=out.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;let j=x%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function side(cards){return {hp:18,maxHp:18,plate:0,plateReady:true,supply:0,deck:cards,hand:[],discard:[],lanes:[[null,null],[null,null]],passed:false,repositioned:false}}
function draw(p,n){p.hand.push(...p.deck.splice(0,n))}
function newBattle(seed=20261126,families=["sword","bow"]){if(families.length!==2||new Set(families).size!==2||families.some(f=>!["sword","spear","bow","rider"].includes(f)))throw Error("Choose two distinct families");let rival=["rider","spear","bow","sword"].slice(0,2);let s={seed,round:1,priority:seed%2,players:[side(shuffle(deck(families),seed)),side(shuffle(deck(rival),seed^0x9e3779b9))],log:[],result:null};startRound(s);return s}
function legal(s,i){let p=s.players[i],a=[];if(s.phase==="choice"){if(s.pending.side!==i)return [];return p.hand.map((_,h)=>({type:s.pending.kind,h}))}if(s.phase!=="muster"||s.turn!==i||p.passed)return [];a.push({type:"pass"});p.hand.forEach((id,h)=>{if(defs[id]){if(p.supply<defs[id][2])return;p.lanes.forEach((l,lane)=>{if(!l[0])a.push({type:"deploy",h,lane,slot:0});else if(!l[1])a.push({type:"deploy",h,lane,slot:1})})}else if(p.supply>=1){if(id==="courier"&&p.deck.length)a.push({type:"courier",h});p.lanes.forEach((l,lane)=>{if(id==="watch"&&l[0]&&l[1])a.push({type:"watch",h,lane});if(id==="screen"&&l[0])a.push({type:"screen",h,lane});if(id==="stitch")l.forEach((u,slot)=>{if(u&&u.hp<u.maxHp)a.push({type:"stitch",h,lane,slot})})})}});if(!p.repositioned)p.lanes.forEach((l,lane)=>{if(l[0]&&!p.lanes[1-lane][0]&&!p.lanes[1-lane][1]&&p.supply>=(l[0].family==="rider"?0:1))a.push({type:"move",lane})});return a}
function advance(s,i){if(s.players.every(p=>p.passed)){s.phase="order";return}s.phase="muster";s.turn=s.players[1-i].passed?i:1-i}
function isOrder(o){return o&&[0,1].includes(o.lane)&&["press","hold"].includes(o.kind)}
// Damage arrays are indexed by defender, then lane. Reports keep the pre-clash
// names so a promoted rear cannot be mistaken for the unit that took the hit.
function clash(state, orders) {
  if (orders.length !== 2 || !orders.every(isOrder)) throw Error("Invalid orders");
  const hit = [[0, 0], [0, 0]];
  const breach = [[0, 0], [0, 0]];
  const guard = [[0, 0], [0, 0]];
  const reports = [[], []];
  const fortDamage = [0, 0];
  const plateAbsorbed = [0, 0];

  for (const side of [0, 1]) {
    const defender = state.players[side];
    const attacker = state.players[1 - side];
    const defence = orders[side];
    const offence = orders[1 - side];
    for (const lane of [0, 1]) {
      const [target, reserve] = defender.lanes[lane];
      const [lead, rear] = attacker.lanes[lane];
      const holding = defence.lane === lane && defence.kind === "hold";
      const pressing = offence.lane === lane && offence.kind === "press";
      if (target) {
        guard[side][lane] = target.guard + (holding ? 2 : 0);
        if (holding && target.family === "sword" && target.form >= 3) guard[side][lane]++;
        if (reserve && target.family === "spear" && target.form === 4) guard[side][lane]++;
        if (target.moved && target.family === "rider" && target.form >= 3) guard[side][lane]++;
      }
      if (!lead) continue;
      if (!target) {
        let incoming = pressing ? 3 : 2;
        if (pressing && lead.id === "rider4" && lead.moved) incoming++;
        const otherLead = defender.lanes[1 - lane][0];
        const cover = defence.lane !== lane && defence.kind === "hold" && otherLead?.id === "sword4" ? 1 : 0;
        const held = holding ? Math.min(2, incoming) : 0;
        breach[side][lane] = Math.max(0, incoming - held - cover);
        reports[side][lane] = { kind: "breach", attacker: lead.name, incoming, held, cover };
        continue;
      }

      const cancelsPress = holding && target.family === "spear" && target.form >= 3;
      let attack = lead.atk + (pressing && !cancelsPress ? 1 : 0);
      if (pressing && lead.family === "sword" && lead.form >= 2) attack++;
      if (lead.family === "spear" && target.family === "rider") attack += lead.form >= 2 ? 2 : 1;
      if (lead.family === "rider" && lead.form >= 2 && lead.moved) attack++;
      let armour = target.def;
      if (rear?.family === "bow") {
        attack += Math.ceil(rear.atk / 2);
        if (rear.form >= 2 && offence.lane === lane && offence.kind === "hold") attack++;
        armour = Math.max(0, armour - Math.max(0, rear.form - 2));
      }
      hit[side][lane] = Math.max(0, Math.max(1, attack - armour) - guard[side][lane]);
      reports[side][lane] = { kind: "strike", attacker: lead.name, target: target.name,
        attack, armour, guard: guard[side][lane], damage: hit[side][lane], falls: hit[side][lane] >= target.hp };
    }
    const total = breach[side][0] + breach[side][1];
    plateAbsorbed[side] = defender.plateReady ? Math.min(total, defender.plate * 2) : 0;
    fortDamage[side] = total - plateAbsorbed[side];
  }
  return { hit, breach, fortDamage, guard, reports, plateAbsorbed };
}
function resolve(s,orders){let c=clash(s,orders);for(let i=0;i<2;i++){let p=s.players[i];if(c.breach[i].some(n=>n>0)&&p.plate>0)p.plateReady=false;p.hp=Math.max(0,p.hp-c.fortDamage[i]);for(let l=0;l<2;l++){let [u,r]=p.lanes[l];if(u){u.hp-=c.hit[i][l];if(u.hp<=0){p.discard.push(u.id);p.lanes[l]=[r,null]}}for(let x of p.lanes[l])if(x){x.guard=0;x.moved=false}}}s.orders=orders;s.log.push(`Reveal: ${orders.map(o=>o.kind+" "+["Road","Ridge"][o.lane]).join(" / ")} · fort damage ${c.fortDamage.join(" / ")} · unit damage ${c.hit.map(x=>x.join(",")).join(" / ")}`);let [a,b]=s.players;let score=p=>p.lanes.flat().reduce((sum,u)=>sum+(u?.hp||0),0);if(a.hp===0||b.hp===0||s.round===8){s.result=a.hp!==b.hp?(a.hp>b.hp?"win":"loss"):a.hp===0?"draw":score(a)===score(b)?"draw":score(a)>score(b)?"win":"loss";s.phase="result"}else{s.phase="reveal"}return c}
function next(s){if(s.phase!=="reveal")throw Error("Not revealed");s.round++;s.priority=1-s.priority;startRound(s)}
function aiAction(s){let a=legal(s,1),p=s.players[1];if(!a.length)return null;let score=x=>{if(x.type==="deploy"){let u=unit(p.hand[x.h]);return (x.slot===0?12: u.family==="bow"?9:4)+u.atk-u.cost*.3}if(x.type==="stitch")return 9;if(x.type==="screen")return 4;if(x.type==="courier")return 2;if(x.type==="bottom"||x.type==="discard")return defs[p.hand[x.h]]?0:1;return x.type==="pass"?0:-1};return a.reduce((best,x)=>score(x)>score(best)?x:best)}
function aiOrder(s){let options=[0,1].flatMap(lane=>["press","hold"].map(kind=>({lane,kind})));let value=o=>options.reduce((sum,h)=>{let c=clash(s,[h,o]);return sum+5*(c.fortDamage[0]-c.fortDamage[1])+c.hit[0].reduce((a,b)=>a+b,0)-c.hit[1].reduce((a,b)=>a+b,0)},0);return options.reduce((a,b)=>value(b)>value(a)?b:a)}
export {defs,tactics,unit,deck,newBattle,legal,apply,clash,resolve,next,aiAction,aiOrder};

import skills from "../data/skills.json";

function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function rand(){ return Math.random(); }
function roll(pct){ return rand() < pct/100; }

export function makeRunner(config){
  return {
    id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2),
    name: config.name,
    strategy: config.strategy,
    speed: clamp(+config.speed||0,0,1500),
    stamina: clamp(+config.stamina||0,0,1500),
    power: clamp(+config.power||0,0,1500),
    guts: clamp(+config.guts||0,0,1500),
    wisdom: clamp(+config.wisdom||0,0,1500),
    skillIds: [...(config.skillIds||[])]
  };
}

function baseSpeed(statSpeed, distance){
  const v = 15 + (statSpeed/1500)*5; // m/s
  const adj = distance >= 2600 ? -0.5 : distance >= 2000 ? -0.2 : 0;
  return Math.max(12, v + adj);
}

function staminaCost(distance, pace, stamina, track){
  const tMul = track === "yielding" ? 1.12 : track === "good" ? 1.05 : 1;
  const base = distance * 0.9 * tMul;
  const paceMul = 0.7 + pace*0.6;
  const statMitigation = 1 - Math.min(stamina/3000, 0.35);
  return base * paceMul * statMitigation;
}

function wisdomProcBonus(wis){
  return {
    procAdd: Math.min(25, wis/60),
    pacingStability: Math.min(0.15, wis/10000)
  };
}

function applySkills(runner, phase, ctx){
  const w = wisdomProcBonus(runner.wisdom);
  let speedMul = 1, accelAdd = 0, staminaSave = 0;

  for(const skId of runner.skillIds){
    const sk = skills.find(s => s.id === skId);
    if(!sk || sk.phase !== phase) continue;
    const chance = (sk.trigger?.chance_pct || 0) + w.procAdd;
    if(roll(chance)){
      if(sk.effects?.speed_pct) speedMul *= 1 + (sk.effects.speed_pct/100);
      if(sk.effects?.acceleration_pct) accelAdd += sk.effects.acceleration_pct/100;
      if(sk.effects?.stamina_save_pct) staminaSave += sk.effects.stamina_save_pct/100;
      ctx.log.push(`${runner.name}: activó ${sk.name} (${phase})`);
    }
  }
  return { speedMul, accelAdd, staminaSave };
}

export function simulateRace(runners, opts){
  const distance = +opts.distance;
  const track = opts.track || "firm";
  const weather = opts.weather || "clear";

  const results = [];
  const log = [];

  const weatherMul = weather === "rain" ? 0.98 : weather === "cloudy" ? 0.995 : 1;

  for(const r of runners){
    const paceBase = r.strategy === "runner" ? 0.95
                    : r.strategy === "leader" ? 0.9
                    : r.strategy === "betweener" ? 0.85
                    : 0.82;

    const phases = [
      { key: "start", frac: 0.15 },
      { key: "mid", frac: 0.65 },
      { key: "final", frac: 0.20 }
    ];

    let remainingStamina = r.stamina;
    let totalTime = 0;
    const ctx = { log };

    for(const ph of phases){
      const segDist = distance * ph.frac;
      const baseV = baseSpeed(r.speed, distance) * weatherMul;
      const skill = applySkills(r, ph.key, ctx);

      const accel = 0.02 + (r.power/1500)*0.03 + skill.accelAdd;
      const jitter = (Math.random()-0.5) * 0.06;
      const pace = Math.max(0.75, Math.min(1.05, paceBase + jitter));
      const segSpeed = baseV * pace * skill.speedMul;

      const cost = staminaCost(segDist, pace, r.stamina, track) * (1 - skill.staminaSave);
      remainingStamina -= cost;

      const tiredMul = remainingStamina < 0 ? 0.88 : 1;
      const vEff = segSpeed * tiredMul;

      const accelBenefit = 1 - Math.min(0.04, accel/10);
      const segTime = (segDist / vEff) * accelBenefit;
      totalTime += segTime;
    }

    results.push({ name: r.name, strategy: r.strategy, time: +totalTime.toFixed(3) });
  }

  results.sort((a,b)=>a.time-b.time);
  return { results, log };
}
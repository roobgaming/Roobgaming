import characters from "../data/characters.json";
import rules from "../data/compat-rules.json";

// Cargas opcionales (solo necesarias en modo "groups")
let groups = [];
let charWins = {};
let races = [];
try {
  groups = (await import("../data/compat-groups.json")).default;
  charWins = (await import("../data/char-wins.json")).default;
  races = (await import("../data/races.json")).default;
} catch (_) {
  // Si faltan archivos, el modo "groups" mostrará una nota en el breakdown
}

// -------------------- Modo simplificado (tags/aptitudes) --------------------
const aptScore = (apt) =>
  apt === "A" ? rules.weights.aptitude_match_A
  : apt === "B" ? rules.weights.aptitude_match_B
  : 0;

function hasSharedStrategy(a, b){
  const strategies = ["runner","leader","betweener","chaser"];
  const aStrategy = strategies.find(s => a.tags.includes(s));
  const bStrategy = strategies.find(s => b.tags.includes(s));
  return aStrategy && bStrategy && aStrategy === bStrategy ? rules.weights.shared_strategy : 0;
}

function sharedDistanceTags(a, b){
  const dTags = ["short","mile","medium","long"];
  const inter = dTags.filter(t => a.tags.includes(t) && b.tags.includes(t));
  return inter.length > 0 ? rules.weights.shared_distance_tag : 0;
}

function uniquePairBonus(aId, bId){
  const hit = (rules.unique_pairs || []).find(p =>
    (p.a === aId && p.b === bId) || (p.a === bId && p.b === aId)
  );
  return hit ? { score: parseInt(String(hit.score), 10) || 0, reason: hit.reason } : { score: 0, reason: "" };
}

function computeCompatibilitySimplified(mainId, slotIds){
  const main = characters.find(c => c.id === mainId);
  if(!main) return { score: 0, breakdown: ["Seleccione el personaje principal." ] };

  const notes = [];
  let total = 0;

  const consider = slotIds.filter(Boolean).map(id => characters.find(c => c.id === id)).filter(Boolean);

  for(const ch of consider){
    const pair = `${ch.name} ↔ ${main.name}`;
    const s1 = hasSharedStrategy(main, ch);
    if(s1){ total += s1; notes.push(`${pair}: estrategia compartida +${s1}`); }

    const s2 = sharedDistanceTags(main, ch);
    if(s2){ total += s2; notes.push(`${pair}: etiqueta de distancia compartida +${s2}`); }

    const distPref = ["short","mile","medium","long"].find(d => main.tags.includes(d));
    if(distPref){
      const a1 = aptScore(main.aptitudes?.[distPref] ?? "C");
      const a2 = aptScore(ch.aptitudes?.[distPref] ?? "C");
      if(a1){ notes.push(`${main.name}: aptitud ${distPref} ${main.aptitudes?.[distPref]} +${a1}`); total += a1; }
      if(a2){ notes.push(`${ch.name}: aptitud ${distPref} ${ch.aptitudes?.[distPref]} +${a2}`); total += a2; }
    }

    const uniq = uniquePairBonus(main.id, ch.id);
    if(uniq.score){ total += uniq.score; notes.push(`${pair}: sinergia única +${uniq.score} (${uniq.reason})`); }
  }

  const legacyCount = slotIds.filter(id => id?.startsWith?.("legacy|")).length;
  if(legacyCount > 0){
    const bonus = legacyCount * (rules.weights?.legacy_bonus || 0);
    total += bonus;
    notes.push(`Bonificación de legado (${legacyCount}) +${bonus}`);
  }

  return { score: Math.max(0,total), breakdown: notes };
}

// -------------------- Modo grupos oficiales (+3 G1) --------------------
const charById = (id) => characters.find(c => c.id === id);

function onlyG1Wins(ids){
  if(!Array.isArray(ids) || !Array.isArray(races)) return [];
  const g1 = new Set(races.filter(r => r.grade === "G1").map(r => r.id));
  return ids.filter(id => g1.has(id));
}

function pairCommonG1(aId, bId){
  if(!aId || !bId) return 0;
  const A = new Set(onlyG1Wins(charWins[aId]));
  const B = new Set(onlyG1Wins(charWins[bId]));
  let c = 0;
  for(const id of A){ if(B.has(id)) c++; }
  return c;
}

function inGroup(group, ...ids){
  const s = new Set(group.members);
  return ids.every(id => !!id && s.has(id));
}

function computeCompatibilityGroups(mainId, slots){
  const main = charById(mainId);
  if(!main) return { score: 0, breakdown: ["Seleccione el personaje principal."] };

  const [sl11, sl12, sl21, sl22, l1, l2] = slots; // orden UI
  const notes = [];
  let total = 0;

  if(!groups?.length){
    return {
      score: 0,
      breakdown: [
        "Faltan datos de grupos (data/compat-groups.json).",
        "Añade tus grupos o cambia rules.mode a 'simple'."
      ]
    };
  }

  // 1) Suma por grupos
  for(const g of groups){
    const r = parseInt(String(g.rating), 10) || 0;
    if(!r) continue;

    // main ↔ legacy
    if(inGroup(g, mainId, l1)){ total += r; notes.push(`[Grupo] ${charById(mainId)?.name} ↔ ${charById(l1)?.name}: +${r}`); }
    if(inGroup(g, mainId, l2)){ total += r; notes.push(`[Grupo] ${charById(mainId)?.name} ↔ ${charById(l2)?.name}: +${r}`); }

    // tripletas main-legacy-sublegacy
    if(inGroup(g, mainId, l1, sl11)){ total += r; notes.push(`[Grupo] ${charById(mainId)?.name} ↔ ${charById(l1)?.name} ↔ ${charById(sl11)?.name}: +${r}`); }
    if(inGroup(g, mainId, l1, sl12)){ total += r; notes.push(`[Grupo] ${charById(mainId)?.name} ↔ ${charById(l1)?.name} ↔ ${charById(sl12)?.name}: +${r}`); }
    if(inGroup(g, mainId, l2, sl21)){ total += r; notes.push(`[Grupo] ${charById(mainId)?.name} ↔ ${charById(l2)?.name} ↔ ${charById(sl21)?.name}: +${r}`); }
    if(inGroup(g, mainId, l2, sl22)){ total += r; notes.push(`[Grupo] ${charById(mainId)?.name} ↔ ${charById(l2)?.name} ↔ ${charById(sl22)?.name}: +${r}`); }

    // legados entre sí
    if(inGroup(g, l1, l2)){ total += r; notes.push(`[Grupo] ${charById(l1)?.name} ↔ ${charById(l2)?.name}: +${r}`); }
  }

  // 2) Factor oculto: +3 por G1 compartidas en los pares
  if(rules.hiddenWinsEnabled){
    const add = (aId, bId, label) => {
      const n = pairCommonG1(aId, bId);
      if(n > 0){
        const pts = 3 * n;
        total += pts;
        notes.push(`[G1] ${label}: ${n} carreras en común × +3 = +${pts}`);
      }
    };
    add(l1, sl11, `${charById(l1)?.name} ↔ ${charById(sl11)?.name}`);
    add(l1, sl12, `${charById(l1)?.name} ↔ ${charById(sl12)?.name}`);
    add(l2, sl21, `${charById(l2)?.name} ↔ ${charById(sl21)?.name}`);
    add(l2, sl22, `${charById(l2)?.name} ↔ ${charById(sl22)?.name}`);
    add(l1, l2, `${charById(l1)?.name} ↔ ${charById(l2)?.name}`);
  } else {
    notes.push("Nota: Puntos por G1 desactivados (hiddenWinsEnabled=false).");
  }

  return { score: Math.max(0,total), breakdown: notes };
}

export function computeCompatibility(mainId, slotIds){
  if(rules.mode === "groups") {
    return computeCompatibilityGroups(mainId, slotIds);
  }
  return computeCompatibilitySimplified(mainId, slotIds);
}

export function listCharacters(){ return characters; }

import { computeCompatibility, listCharacters } from "./compatibility.js";

const modal = document.getElementById("picker-modal");
const pickerList = document.getElementById("picker-list");
const pickerSearch = document.getElementById("picker-search");
const pickerClose = document.getElementById("picker-close");

let currentSlot = null;
let picked = {
  "sl-1-1": null,
  "sl-1-2": null,
  "sl-2-1": null,
  "sl-2-2": null,
  "legacy-1": null,
  "legacy-2": null,
  "main": null
};

function openPicker(slot){
  currentSlot = slot;
  modal.classList.add("is-open");
  renderPicker();
}
function closePicker(){
  modal.classList.remove("is-open");
  pickerSearch.value = "";
}

function renderPicker(){
  const q = pickerSearch.value?.toLowerCase() ?? "";
  const chars = listCharacters().filter(c => c.name.toLowerCase().includes(q));
  pickerList.innerHTML = "";
  for(const ch of chars){
    const row = document.createElement("div");
    row.className = "picker-item";
    row.innerHTML = `
      <div>
        <div><strong>${ch.name}</strong></div>
        <div class="small">${ch.tags.join(", ")}</div>
      </div>
        <button data-id="${ch.id}">Elegir</button>
    `;
    row.querySelector("button")?.addEventListener("click", ()=>{
      picked[currentSlot] = ch.id;
      const card = document.querySelector(`.slot-card[data-slot="${currentSlot}"]`);
      card.querySelector(".slot-icon").textContent = ch.name[0];
      card.querySelector(".slot-title").textContent = ch.name;
      closePicker();
      updateResult();
    });
    pickerList.appendChild(row);
  }
}

function updateResult(){
  const mainId = picked["main"];
  const order = ["sl-1-1","sl-1-2","sl-2-1","sl-2-2","legacy-1","legacy-2"];
  const slotIds = order.map(k => picked[k]);
  const { score, breakdown } = computeCompatibility(mainId, slotIds);

  document.getElementById("compat-score-val").textContent = String(score);
  const bd = document.getElementById("compat-breakdown");
  bd.innerHTML = breakdown.map(x => `<div>• ${x}</div>`).join("") || "<em>Seleccione personajes para ver el cálculo.</em>";
}

export function initCompat(){
  document.querySelectorAll(".slot-card .slot-action").forEach(btn=>{
    const card = btn.closest(".slot-card");
    const slot = card.getAttribute("data-slot");
    btn.addEventListener("click", ()=>openPicker(slot));
  });

  document.getElementById("btn-reset").addEventListener("click", ()=>{
    for(const k of Object.keys(picked)) picked[k]=null;
    document.querySelectorAll(".slot-card").forEach(card=>{
      card.querySelector(".slot-icon").textContent = "+";
      card.querySelector(".slot-title").textContent =
        card.classList.contains("center") ? "Personaje principal"
        : card.classList.contains("tall") ? (card.getAttribute("data-slot")==="legacy-1"?"Legado 1":"Legado 2")
        : card.getAttribute("data-slot").toUpperCase().replace("-"," ");
    });
    updateResult();
  });

  document.getElementById("btn-recommend").addEventListener("click", ()=>{
    const chars = listCharacters();
    const main = chars.find(c => c.id === picked.main);
    if(!main){ alert("Seleccione el personaje principal primero."); return; }
    const others = chars.filter(c => c.id !== main.id);
    const scoreTag = (c) => c.tags.filter(t => main.tags.includes(t)).length;
    others.sort((a,b)=>scoreTag(b)-scoreTag(a));

    const sls = ["sl-1-1","sl-1-2","sl-2-1","sl-2-2"];
    sls.forEach((slot,i)=>{
      const ch = others[i];
      if(ch){
        picked[slot]=ch.id;
        const card = document.querySelector(`.slot-card[data-slot="${slot}"]`);
        card.querySelector(".slot-icon").textContent = ch.name[0];
        card.querySelector(".slot-title").textContent = ch.name;
      }
    });
    updateResult();
  });

  pickerClose.addEventListener("click", closePicker);
  modal.querySelector(".modal-backdrop").addEventListener("click", closePicker);
  pickerSearch.addEventListener("input", renderPicker);

  updateResult();
}
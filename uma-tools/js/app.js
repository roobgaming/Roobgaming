import { initCompat } from "./ui-compat.js";
import { initSim } from "./ui-sim.js";

function switchTab(tab){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("is-active", b.dataset.tab===tab));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.toggle("is-active", p.id===`tab-${tab}`));
}

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=>switchTab(btn.dataset.tab));
});

initCompat();
initSim();

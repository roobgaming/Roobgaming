import { makeRunner, simulateRace } from "./simulator.js";
import characters from "../data/characters.json";
import skills from "../data/skills.json";

const runnerModal = document.getElementById("runner-modal");
const runnerClose = document.getElementById("runner-close");
const runnerSave = document.getElementById("runner-save");
const runnerCharSel = document.getElementById("runner-char");
const runnerStrategySel = document.getElementById("runner-strategy");
const statInputs = {
  speed: document.getElementById("stat-speed"),
  stamina: document.getElementById("stat-stamina"),
  power: document.getElementById("stat-power"),
  guts: document.getElementById("stat-guts"),
  wisdom: document.getElementById("stat-wisdom")
};
const skillsList = document.getElementById("skills-list");

const distanceSel = document.getElementById("sim-distance");
const trackSel = document.getElementById("sim-track");
const weatherSel = document.getElementById("sim-weather");
const runnerList = document.getElementById("runner-list");
const btnAddRunner = document.getElementById("btn-add-runner");
const btnRun = document.getElementById("btn-run");
const simLog = document.getElementById("sim-log");
const tableBody = document.getElementById("sim-table-body");

let currentRunnerDraft = null;
let roster = [];

function openRunnerModal(){
  currentRunnerDraft = { skillIds: [] };
  runnerCharSel.innerHTML = characters.map(c=>`<option value="${c.name}">${c.name}</option>`).join("");
  skillsList.innerHTML = "";
  for(const sk of skills){
    const chip = document.createElement("button");
    chip.className = "skill-chip";
    chip.textContent = sk.name;
    chip.addEventListener("click", ()=>{
      chip.classList.toggle("is-selected");
      if(chip.classList.contains("is-selected")) currentRunnerDraft.skillIds.push(sk.id);
      else currentRunnerDraft.skillIds = currentRunnerDraft.skillIds.filter(id => id!==sk.id);
    });
    skillsList.appendChild(chip);
  }
  runnerModal.classList.add("is-open");
}
function closeRunnerModal(){ runnerModal.classList.remove("is-open"); }

function renderRoster(){
  runnerList.innerHTML = "";
  roster.forEach((r, idx)=>{
    const card = document.createElement("div");
    card.className = "runner-card";
    card.innerHTML = `
      <div class="runner-header">
        <strong>${r.name}</strong>
        <span class="tag">${r.strategy}</span>
      </div>
      <div class="small">VEL ${r.speed} | RES ${r.stamina} | POT ${r.power} | COR ${r.guts} | SAB ${r.wisdom}</div>
      <div class="small">${r.skillIds.length} habilidades</div>
      <div class="actions">
        <button class="icon-btn" data-act="remove">Eliminar</button>
      </div>
    `;
    card.querySelector('[data-act="remove"]').addEventListener("click", ()=>{
      roster.splice(idx,1);
      renderRoster();
    });
    runnerList.appendChild(card);
  });
}

export function initSim(){
  btnAddRunner.addEventListener("click", openRunnerModal);
  runnerClose.addEventListener("click", closeRunnerModal);
  runnerModal.querySelector(".modal-backdrop").addEventListener("click", closeRunnerModal);

  runnerSave.addEventListener("click", ()=>{
    const cfg = {
      name: runnerCharSel.value,
      strategy: runnerStrategySel.value,
      speed: +statInputs.speed.value,
      stamina: +statInputs.stamina.value,
      power: +statInputs.power.value,
      guts: +statInputs.guts.value,
      wisdom: +statInputs.wisdom.value,
      skillIds: currentRunnerDraft.skillIds
    };
    roster.push(makeRunner(cfg));
    closeRunnerModal();
    renderRoster();
  });

  btnRun.addEventListener("click", ()=>{
    if(roster.length < 2){ alert("Añade al menos 2 corredores."); return; }
    const { results, log } = simulateRace(roster, {
      distance: +distanceSel.value,
      track: trackSel.value,
      weather: weatherSel.value
    });
    simLog.innerHTML = log.map(l => `• ${l}`).join("<br>") || "<em>Sin activaciones.</em>";
    tableBody.innerHTML = "";
    results.forEach((r, i)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${r.name}</td>
        <td>${r.strategy}</td>
        <td>${r.time}</td>
      `;
      tableBody.appendChild(tr);
    });
  });

  renderRoster();
}
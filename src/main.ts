import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/fraunces/latin-500.css";
import "@fontsource/fraunces/latin-600.css";
import "./style.css";
import { levels, names, sizes, type Kind, type Part } from "./levels";
import { Editor } from "./editor";
import { Simulation } from "./physics";
import { decode, readSave, writeSave } from "./storage";
const app = document.querySelector<HTMLDivElement>("#app")!;
let save = readSave(),
  index = 0,
  editor = new Editor(levels[0]),
  sim: Simulation | null = null,
  mode: "edit" | "running" | "paused" = "edit",
  tool: Kind | null = null,
  showHint = false,
  awarded = false,
  drag: { id: string; x: number; y: number; ox: number; oy: number } | null =
    null,
  preview: Part | null = null;
let audio: AudioContext | null = null;
editor.load(save.designs[editor.level.id] ?? []);
app.innerHTML = `<header><a class="brand" href="#" aria-label="Copper and Cogs home"><span class="brand-icon">⚙</span><span>Copper <i>&</i> Cogs<small>A CONTRAPTION WORKSHOP</small></span></a><div class="header-right"><span class="tag">Small parts. Grand ideas.</span><button id="mute" aria-label="Toggle sound"></button><button id="help">How to play</button></div></header><main><section class="brief"><div><span id="chapter" class="eyebrow"></span><h1 id="title"></h1><p id="lesson"></p></div><button id="hint" class="text-btn">✧ A little hint</button><p id="hint-text" hidden></p></section><div class="workspace"><aside><div class="tray-head"><h2>Parts drawer</h2><span id="part-count"></span></div><p class="micro">Pick a part, then tap the bench.</p><div id="inventory"></div><button id="place-center" disabled>Place on bench</button><label class="placed-label">Placed parts<select id="placed"><option value="">Select a part</option></select></label><div class="inspector"><h3>Fine adjustments</h3><p id="selection">Select a placed part to adjust it.</p><div id="fields"><label>X<input id="x" type="number" min="10" max="950" step="10"></label><label>Y<input id="y" type="number" min="10" max="570" step="10"></label><label>Angle<input id="angle" type="number" min="-180" max="180" step="5"></label></div><button id="apply">Apply position</button><div class="pair"><button id="rotate">↻ Rotate 5°</button><button id="remove">Return part</button></div></div></aside><section class="bench-panel"><div class="bench-top"><span><b class="dot"></b> <span id="mode-label">DESIGN MODE</span></span><span id="objective">◎ Deliver the ball to the basket</span></div><svg id="bench" viewBox="0 0 960 600" role="img" aria-label="Physics workbench. Select a part from the drawer, tap to place, or use fine adjustments." tabindex="0"></svg><div class="transport"><div class="pair"><button id="run" class="primary">▶ Run machine</button><button id="reset">↺ Reset</button></div><div class="pair"><button id="undo" title="Undo (Ctrl/⌘ Z)">↶ Undo</button><button id="redo" title="Redo (Ctrl/⌘ Shift Z)">↷ Redo</button></div><span id="timer">00.0s</span></div><div id="status" role="status" aria-live="polite">The bench is yours. Make something happen.</div></section></div><section class="campaign"><div class="campaign-heading"><h2>The inventor’s notebook</h2><span id="progress"></span></div><nav id="levels" aria-label="Challenges"></nav></section><footer>MADE FOR CURIOUS MINDS <span>Drag to move · R to rotate · Delete to return · Space to run/pause</span></footer></main><dialog id="help-dialog"><button id="close-help" class="close">Close ×</button><span class="eyebrow">WELCOME, INVENTOR</span><h2>One thing leads to another.</h2><p>Pick parts from the drawer, then tap the bench or choose Place on bench. Select existing parts from the Placed parts menu or tap them. Drag a part to move it. Use the fine adjustments for precise positions, or arrow keys to nudge a selected part.</p><p>R rotates by 5° (Shift reverses). Delete returns a part. Undo and redo remember your changes. Run starts gravity; pause freezes it; reset restores your exact design.</p><p>The brass basket needs a ball to settle inside. Green switches power all fans. Fans blow along their arrow; springs launch away from their surface. Fixed starting balls cannot be moved. Your designs and completed challenges save on this browser.</p><p>On touch screens, tap to place, drag to move, and use the visible rotation controls. Turn on sound for quiet mechanical notes.</p><hr><p>Start a fresh notebook to clear this workshop. Your current notebook is archived locally and can be restored.</p><div class="pair"><button id="new-notebook">New notebook</button><button id="restore-notebook">Restore archived notebook</button></div></dialog>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const bench = document.getElementById("bench") as unknown as SVGSVGElement;
function sound(freq = 440) {
  if (save.muted) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.2);
  } catch {}
}
function persist() {
  save.designs[editor.level.id] = structuredClone(editor.parts);
  if (!writeSave(save))
    $("status").textContent =
      "Browser storage unavailable. This design lasts for this visit.";
}
function partArt(p: Part) {
  const selected = p.id === editor.selected && mode === "edit";
  const body =
    p.kind === "ramp"
      ? `<rect x="-90" y="-8" width="180" height="16" rx="5" fill="#b66e47" stroke="#613e30" stroke-width="3"/><path d="M-80 -3H80" stroke="#e8b57c" stroke-width="3"/><circle cx="-78" r="3"/><circle cx="78" r="3"/>`
      : p.kind === "spring"
        ? `<path d="M-36 8l12 -18 12 18 12 -18 12 18 12 -18 12 18" fill="none" stroke="#34515a" stroke-width="4"/><rect x="-45" y="-10" width="90" height="8" rx="3" fill="#e7bd59" stroke="#8a642d" stroke-width="2"/><path d="M0 -18v-25m-6 6 6-6 6 6" fill="none" stroke="#b27f28" stroke-width="3"/>`
        : p.kind === "fan"
          ? `<path d="M32 -35L300 -75V75L32 35Z" fill="#5aa29e" opacity=".09" pointer-events="none"/><rect x="-30" y="-30" width="60" height="60" rx="13" fill="#285961" stroke="#183d46" stroke-width="3"/><circle r="21" fill="#a9c9c0"/><path d="M0 0C-25 -28 26 -28 0 0C30 -18 30 24 0 0C15 30 -27 25 0 0" fill="#376873"/><circle r="5" fill="#e7bd59"/><path d="M38 0h33m-9-7 9 7-9 7" fill="none" stroke="#398579" stroke-width="3"/>`
          : `<circle r="16" fill="url(#${p.kind})" stroke="${p.kind === "steel" ? "#405860" : "#953e30"}" stroke-width="2"/><ellipse cx="-5" cy="-6" rx="5" ry="3" fill="white" opacity=".55"/>`;
  return `<g data-id="${p.id}" transform="translate(${p.x} ${p.y}) rotate(${p.angle})" class="part">${selected ? `<rect x="${-sizes[p.kind][0] / 2 - 10}" y="${-sizes[p.kind][1] / 2 - 10}" width="${sizes[p.kind][0] + 20}" height="${sizes[p.kind][1] + 20}" rx="9" fill="#e8bd5b" fill-opacity=".18" stroke="#d49e36" stroke-width="2" stroke-dasharray="5 4"/>` : ""}${body}</g>`;
}
function draw() {
  const l = editor.level,
    positions = new Map(sim?.positions().map((p) => [p.id, p]) ?? []);
  const parts = [...l.fixed, ...editor.parts].map((p) => ({
    ...p,
    ...positions.get(p.id),
  }));
  if (preview) {
    const i = parts.findIndex((p) => p.id === preview!.id);
    if (i >= 0) parts[i] = preview;
  }
  bench.innerHTML = `<defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="#b8b5a5" opacity=".4"/></pattern><radialGradient id="steel" cx="30%" cy="25%"><stop stop-color="#e9f0e7"/><stop offset="1" stop-color="#6e929e"/></radialGradient><radialGradient id="rubber" cx="30%" cy="25%"><stop stop-color="#efac7d"/><stop offset="1" stop-color="#c56249"/></radialGradient></defs><rect width="960" height="600" fill="#eee9d9"/><rect x="10" y="10" width="940" height="560" fill="url(#grid)"/><path d="M10 580H950" stroke="#c3bcaa" stroke-width="3"/><text x="30" y="555" class="bench-note">${mode === "edit" ? "ARRANGE • EXPERIMENT • REPEAT" : "FOLLOW THE CHAIN REACTION"}</text><g transform="translate(${l.target.x} ${l.target.y})"><path d="M-50 -32v63h100v-63" fill="#c99046" fill-opacity=".16" stroke="#a77838" stroke-width="10" stroke-linejoin="round"/><path d="M-36 3h72M-36 17h72" stroke="#b69656" stroke-width="2"/><text y="59" text-anchor="middle" class="basket-label">DELIVERY BASKET</text></g>${l.switch ? `<g transform="translate(${l.switch.x} ${l.switch.y})"><circle r="20" fill="${sim?.powered ? "#75ac78" : "#d6dfc8"}" stroke="#56846a" stroke-width="3"/><path d="M-8 0l5 5 11-12" fill="none" stroke="#41674e" stroke-width="3"/><text y="38" text-anchor="middle" class="basket-label">POWER SWITCH</text></g>` : ""}${parts.map(partArt).join("")}`;
}
function update() {
  const l = editor.level;
  $("chapter").textContent = l.subtitle;
  $("title").textContent = l.title;
  $("lesson").textContent = l.lesson;
  $("hint-text").textContent = l.hint;
  $("hint-text").hidden = !showHint;
  $("mode-label").textContent =
    mode === "edit"
      ? "DESIGN MODE"
      : mode === "paused"
        ? "PAUSED • RESET TO EDIT"
        : "MACHINE RUNNING";
  $("objective").textContent = l.switch
    ? "◎ Switch on → settle in basket"
    : l.id === "sandbox"
      ? "∞ Follow your curiosity"
      : "◎ Settle a ball in the basket";
  $("run").textContent =
    mode === "running"
      ? "Ⅱ Pause"
      : mode === "paused"
        ? "▶ Resume"
        : "▶ Run machine";
  $("undo").toggleAttribute("disabled", mode !== "edit" || !editor.canUndo);
  $("redo").toggleAttribute("disabled", mode !== "edit" || !editor.canRedo);
  $("inventory").innerHTML = Object.entries(l.inventory)
    .map(
      ([k]) =>
        `<button class="part-button ${tool === k ? "active" : ""}" data-kind="${k}" ${mode !== "edit" || editor.remaining(k as Kind) < 1 ? "disabled" : ""}><span class="part-symbol">${{ ramp: "╱", spring: "≋", fan: "✣", steel: "●", rubber: "●" }[k as Kind]}</span><span>${names[k as Kind]}<small>${{ ramp: "Roll & redirect", spring: "Bounce toward the arrow", fan: "Push through the air", steel: "Heavy, little bounce", rubber: "Light & lively" }[k as Kind]}</small></span><b>${editor.remaining(k as Kind)}</b></button>`,
    )
    .join("");
  $("place-center").toggleAttribute("disabled", !tool || mode !== "edit");
  $("placed").toggleAttribute("disabled", mode !== "edit");
  $("placed").innerHTML =
    '<option value="">Select a part</option>' +
    editor.parts
      .map(
        (p, i) =>
          `<option value="${p.id}" ${p.id === editor.selected ? "selected" : ""}>${i + 1}. ${names[p.kind]}</option>`,
      )
      .join("");
  $("part-count").textContent = `${editor.parts.length} placed`;
  const p = editor.parts.find((p) => p.id === editor.selected);
  $("selection").textContent = p
    ? names[p.kind]
    : "Select a placed part to adjust it.";
  for (const key of ["x", "y", "angle"] as const) {
    const f = $<HTMLInputElement>(key);
    f.disabled = !p || mode !== "edit";
    if (document.activeElement !== f) f.value = p ? String(p[key]) : "";
  }
  for (const id of ["apply", "rotate", "remove"])
    $(id).toggleAttribute("disabled", !p || mode !== "edit");
  $("mute").textContent = save.muted ? "♫ Sound off" : "♫ Sound on";
  $("mute").setAttribute("aria-pressed", String(!save.muted));
  $("progress").textContent = `${save.completed.length} / 6 delivered`;
  $("levels").innerHTML = levels
    .map(
      (v, i) =>
        `<button data-level="${i}" class="level-card ${index === i ? "current" : ""}" aria-current="${index === i ? "step" : "false"}"><span>${i === 6 ? "∞" : String(i + 1).padStart(2, "0")} ${save.completed.includes(v.id) ? "✓" : ""}</span><b>${v.title}</b><small>${i === 6 ? "Unlimited parts" : v.subtitle.split("/")[1]}</small></button>`,
    )
    .join("");
  draw();
}
function editDone(ok = true) {
  persist();
  update();
  $("status").textContent = ok
    ? "Design saved. Ready for another experiment."
    : "That position is blocked or outside the bench. Try another spot.";
}
function reset() {
  sim?.dispose();
  sim = null;
  mode = "edit";
  cancelDrag();
  tool = null;
  awarded = false;
  $("timer").textContent = "00.0s";
  update();
  $("status").textContent =
    "Exact design restored. Adjust a part and try again.";
}
let activePointer = 0;
function cancelDrag() {
  drag = null;
  preview = null;
  if (bench.hasPointerCapture(activePointer))
    bench.releasePointerCapture(activePointer);
}
function run() {
  if (mode === "edit") {
    cancelDrag();
    sim = new Simulation(editor.level, structuredClone(editor.parts));
    mode = "running";
    tool = null;
    sound(220);
  } else mode = mode === "running" ? "paused" : "running";
  update();
  $("status").textContent =
    mode === "running"
      ? "Gravity is on. Watch where the energy goes."
      : "Paused. Resume, or reset to edit your design.";
}
$("run").onclick = run;
$("reset").onclick = () => {
  if (bench.hasPointerCapture(activePointer))
    bench.releasePointerCapture(activePointer);
  reset();
};
$("undo").onclick = () => {
  cancelDrag();
  editor.undo();
  editDone();
};
$("redo").onclick = () => {
  cancelDrag();
  editor.redo();
  editDone();
};
$("remove").onclick = () => {
  cancelDrag();
  if (editor.selected) editor.remove(editor.selected);
  editDone();
};
$("rotate").onclick = () => rotate(5);
function rotate(delta: number) {
  cancelDrag();
  const p = editor.parts.find((p) => p.id === editor.selected);
  if (p)
    editDone(
      editor.move(p.id, p.x, p.y, ((p.angle + delta + 540) % 360) - 180),
    );
}
$("apply").onclick = () => {
  cancelDrag();
  const p = editor.parts.find((p) => p.id === editor.selected);
  if (p) {
    const x = Number($<HTMLInputElement>("x").value),
      y = Number($<HTMLInputElement>("y").value),
      a = Number($<HTMLInputElement>("angle").value);
    editDone(
      [x, y, a].every(Number.isFinite) &&
        Math.abs(a) <= 180 &&
        editor.move(p.id, x, y, a),
    );
  }
};
$("place-center").onclick = () => {
  if (!tool || mode !== "edit") return;
  let ok = false;
  for (let y = 200; y <= 500 && !ok; y += 60)
    for (let x = 200; x <= 760 && !ok; x += 100) ok = editor.place(tool, x, y);
  if (ok) {
    tool = null;
    sound(350);
  }
  editDone(ok);
};
$("placed").onchange = () => {
  cancelDrag();
  editor.selected = $<HTMLSelectElement>("placed").value || null;
  update();
};
$("inventory").onclick = (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-kind]");
  if (b && !b.disabled && mode === "edit") {
    tool = b.dataset.kind as Kind;
    editor.selected = null;
    update();
    $("status").textContent =
      `Tap the bench to place a ${names[tool].toLowerCase()}. Escape cancels.`;
  }
};
$("levels").onclick = (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-level]",
  );
  if (!b) return;
  persist();
  reset();
  index = Number(b.dataset.level);
  editor = new Editor(levels[index]);
  editor.load(save.designs[editor.level.id] ?? []);
  showHint = false;
  update();
  $("status").textContent = "A fresh challenge. Every part has a purpose.";
};
$("hint").onclick = () => {
  showHint = !showHint;
  update();
};
$("mute").onclick = () => {
  save.muted = !save.muted;
  persist();
  update();
  sound(440);
};
$("help").onclick = () => {
  if (mode === "running") {
    mode = "paused";
    update();
  }
  cancelDrag();
  $<HTMLDialogElement>("help-dialog").showModal();
};
$("close-help").onclick = () => $<HTMLDialogElement>("help-dialog").close();
function changeNotebook(next: typeof save) {
  const stored = writeSave(next);
  reset();
  save = next;
  index = 0;
  editor = new Editor(levels[0]);
  editor.load(save.designs.first ?? []);
  showHint = false;
  update();
  $<HTMLDialogElement>("help-dialog").close();
  return stored;
}
$("new-notebook").onclick = () => {
  persist();
  if (writeSave(save, "copper-cogs-archive-v1")) {
    const stored = changeNotebook(decode(null));
    $("status").textContent = stored
      ? "Fresh notebook ready. Your previous notebook is archived in How to play."
      : "Fresh notebook for this visit. Storage could not save it; your previous notebook is archived.";
  } else
    $("status").textContent =
      "Could not archive the notebook. Nothing was cleared.";
};
$("restore-notebook").onclick = () => {
  const archived = readSave("copper-cogs-archive-v1");
  if (
    archived.completed.length ||
    Object.values(archived.designs).some((p) => p.length)
  ) {
    const current = save;
    const stored = changeNotebook(archived);
    const backedUp = writeSave(current, "copper-cogs-archive-v1");
    $("status").textContent = !stored
      ? "Notebook restored for this visit. Storage could not save the active notebook."
      : backedUp
        ? "Archived notebook restored. The other notebook is now archived."
        : "Notebook restored. Storage could not archive the previous notebook.";
  }
};
function point(e: PointerEvent) {
  const r = bench.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) * 960) / r.width,
    y: ((e.clientY - r.top) * 600) / r.height,
  };
}
bench.onpointerdown = (e) => {
  if (mode !== "edit" || drag || !e.isPrimary) return;
  e.preventDefault();
  bench.focus();
  const q = point(e);
  if (tool) {
    if (
      editor.place(tool, Math.round(q.x / 10) * 10, Math.round(q.y / 10) * 10)
    ) {
      tool = null;
      sound(350);
      editDone();
    } else editDone(false);
    return;
  }
  const id = (e.target as Element)
    .closest("[data-id]")
    ?.getAttribute("data-id");
  const p = editor.parts.find((p) => p.id === id);
  editor.selected = p?.id ?? null;
  if (p) {
    drag = { id: p.id, x: p.x, y: p.y, ox: q.x, oy: q.y };
    activePointer = e.pointerId;
    bench.setPointerCapture(e.pointerId);
  }
  update();
};
bench.onpointermove = (e) => {
  if (!drag || mode !== "edit" || e.pointerId !== activePointer) return;
  const p = editor.parts.find((p) => p.id === drag!.id)!;
  const q = point(e);
  preview = {
    ...p,
    x: Math.round((drag.x + q.x - drag.ox) / 10) * 10,
    y: Math.round((drag.y + q.y - drag.oy) / 10) * 10,
  };
  draw();
};
bench.onpointerup = (e) => {
  if (!drag || e.pointerId !== activePointer) return;
  const p = preview;
  cancelDrag();
  if (bench.hasPointerCapture(e.pointerId))
    bench.releasePointerCapture(e.pointerId);
  if (p) editDone(editor.move(p.id, p.x, p.y));
  else update();
};
bench.onpointercancel = (e) => {
  if (!drag || e.pointerId !== activePointer) return;
  cancelDrag();
  update();
};
bench.onlostpointercapture = (e) => {
  if (!drag || e.pointerId !== activePointer) return;
  cancelDrag();
  draw();
};
window.addEventListener("keydown", (e) => {
  if (
    $<HTMLDialogElement>("help-dialog").open ||
    ["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(
      (e.target as HTMLElement).tagName,
    )
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    run();
    return;
  }
  if (mode !== "edit") return;
  if (e.key === "Escape") {
    tool = null;
    cancelDrag();
    update();
  }
  if (e.key.toLowerCase() === "r") rotate(e.shiftKey ? -5 : 5);
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    cancelDrag();
    if (editor.selected) editor.remove(editor.selected);
    editDone();
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    cancelDrag();
    e.shiftKey ? editor.redo() : editor.undo();
    editDone();
  }
  const p = editor.parts.find((p) => p.id === editor.selected);
  if (p && e.key.startsWith("Arrow")) {
    e.preventDefault();
    cancelDrag();
    const d = e.shiftKey ? 1 : 10;
    editDone(
      editor.move(
        p.id,
        p.x + (e.key === "ArrowRight" ? d : e.key === "ArrowLeft" ? -d : 0),
        p.y + (e.key === "ArrowDown" ? d : e.key === "ArrowUp" ? -d : 0),
      ),
    );
  }
});
window.addEventListener("blur", () => {
  cancelDrag();
  if (mode === "running") mode = "paused";
  update();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && mode === "running") {
    mode = "paused";
    update();
  }
});
let previous = performance.now();
function frame(now: number) {
  const dt = now - previous;
  previous = now;
  if (mode === "running" && sim) {
    sim.advance(dt);
    draw();
    $("timer").textContent = `${(sim.ticks / 120).toFixed(1)}s`;
    if (sim.won && !awarded) {
      awarded = true;
      if (!save.completed.includes(editor.level.id))
        save.completed.push(editor.level.id);
      persist();
      mode = "paused";
      update();
      $("status").textContent =
        "✦ Delivered! A beautiful chain reaction. Try the next page in your notebook.";
      sound(660);
      setTimeout(() => sound(880), 150);
    } else if (sim.ticks > 3600) {
      mode = "paused";
      update();
      $("status").textContent =
        "Experiment complete. Reset to refine your machine.";
    }
  }
  requestAnimationFrame(frame);
}
update();
requestAnimationFrame(frame);

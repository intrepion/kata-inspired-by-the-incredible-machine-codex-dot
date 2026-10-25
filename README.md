# Copper & Cogs

An original, cozy contraption puzzle workshop inspired by the joy of physical chain reactions. Six challenges teach gravity, elastic energy, airflow and powered handoffs. An unlimited sandbox invites further experiments. Original SVG art, locally bundled fonts and synthesized sound; no accounts, services, telemetry, paid APIs or deployment.

## Play on this Mac

Open **http://127.0.0.1:5182/**. The server is restricted to loopback and runs as a detached session process. It survives the task/tool ending, but is not a boot/login service and may stop at logout/restart. Other game ports 5173–5181 are untouched.

Restart from this repository:

```sh
npm ci
npm run build
npm run play
```

`play` refuses to start if port 5182 is occupied. It prints a PID and writes `copper-cogs-5182.pid` and `copper-cogs-5182.log` in the system temporary directory (exact path is printed). Stop only the verified workshop PID with `kill <PID>`. No autostart or security settings are changed. For foreground development use `npm run dev -- --port 5182 --strictPort` after stopping this workshop server. Rebuild and restart preview after source changes.

## Controls

Pick a part and tap the bench, or use **Place on bench**. Drag to move; use **Placed parts** and X/Y/Angle for precise accessible editing. R rotates 5° (Shift reverses), arrows nudge 10px (Shift: 1px), Delete returns a part, Ctrl/⌘ Z undoes and Ctrl/⌘ Shift Z redoes. Space runs or pauses when the bench is focused. All actions have visible controls for touch. Invalid poses restore the previous design.

Run starts a fresh physics world. Pause freezes it. Reset restores the exact design and permits editing. A delivery requires a ball to settle in the basket; switch chapters require physical contact with the green switch to power the fan. Hints explain mechanics without filling in solutions. **How to play → New notebook** starts fresh and archives the current notebook; **Restore archived notebook** swaps notebooks. Only one prior notebook is retained. Progress and designs belong to this browser and origin, and private browsing/storage restrictions may prevent persistence.

## Verify

```sh
npm test
npm run typecheck
npm run build
npm run format:check
npm audit --audit-level=moderate
```

The 12 regression tests cover inventory, bounds/intersections, rotation/history, removal, saved-data corruption and identifiers, fixed stepping, exact reconstruction, ball properties, all six physical solutions, and missing-stage negative cases. GitHub Actions repeats tests/build/audit. Browser QA and review findings are recorded in [docs/qa/REPORT.md](docs/qa/REPORT.md); architecture, domain terms, acceptance criteria and skill usage are in `docs/` and `GLOSSARY.md`.

## Physics scope

Matter.js provides rigid-body contacts, gravity and differing ball properties. Springs apply an arcade impulse, fans apply directional force, and the power switch uses circular contact distance. These are deterministic gameplay approximations at 120 Hz, not an engineering simulation. No fluids, ropes, motors, gears or seesaws are modeled. Ball escape is allowed during experiments; reset always recovers the design. Runs stop after 30 seconds. Repeatability is regression-tested in the supplied engine/runtime, not guaranteed bit-for-bit across every browser or future engine version.

Real Mac Chrome was tested. Responsive layout and touch/multi-touch input were simulated in that browser; physical phones/tablets, Safari, Firefox, screen-reader output and cross-browser timing were not tested.

## Play online

[Play the hosted game](https://intrepion.github.io/kata-inspired-by-the-incredible-machine-codex-dot/)

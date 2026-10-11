# Verification report

## Mac browser playthrough

Used the supported CUA Chrome tab on this Mac at `http://127.0.0.1:5182/`. Every campaign was arranged through visible parts buttons, bench clicks and X/Y/Angle controls, then run until actual Delivered status appeared. The notebook reached 6/6. Spring and ramp relay were replayed, and repeated completion stayed unique. The final solution has a rolling ramp, physical switch contact and powered airflow; both movable stages are required by simulation regressions.

- Gravity: ramp (270,290), angle 25° → basket.
- Spring: pad (260,480), angle 25° → elevated basket.
- Airflow: fan (180,260), angle 0° → basket.
- Relay: ramps (220,220) and (360,380), each 25° → basket.
- Power: fan (180,300), angle 0°; falling ball touches switch → basket.
- Finale: ramp (230,200), 25°, and fan (230,360), 0°; ramp → switch → wind → basket.

Verified exact reset fields, pause timer held at 0.3s across help modal inspection, resume to completion, disabled editing while running/paused, reload returning to design mode with persisted parts/progress, keyboard Enter placement/removal/undo, accessible placed-part selection, and sandbox inventory. Simulated touch preview moved a part from x300 to x390; owner cancellation restored x300. Two simultaneous touches retained primary ownership and cancellation restored x370. A held mouse drag preview at x390 followed by ⌘ Z restored x370, and pointer release kept x370. Input simulation used supported Chrome CDP input commands, not hidden game-state mutation.

At a 390×844 viewport, DOM clientWidth and scrollWidth both equaled 390. Inspected full-page mobile and desktop screenshots. Restored normal viewport. No app-origin error logs appeared; Chrome extension warnings were excluded. New notebook → 0/6 and 0 parts; restore → 6/6 and saved design. Final handoff uses a fresh notebook with QA progress archived.

Screenshots: [airflow](airflow.jpg), [final delivery](final-delivery.jpg), [mobile](mobile.jpg), [sandbox](sandbox.jpg), and [clean workshop](clean-workshop.jpg).

## Standards review

Initial independent review found unsafe saved identifiers, missing pointer ownership, and duplicated cancellation. Follow-up found keyboard undo during dragging could allow stale preview commit. Resolved with safe ID grammar and regression, primary/owning pointer guards, shared capture cancellation, and cancellation before editor commands. The held-drag undo browser test verified the final fix.

## Specification review

Independent review found incomplete keyboard placement/selection, unsafe IDs and touch ownership. Added native Place on bench and Placed parts controls, ID validation and ownership guards. Re-review found no blocking specification findings. Known physical solutions and missing-stage negatives were independently verified by the reviewer.

## Automated checks

12 tests in three files; typecheck; production build; formatting check; dependency audit with zero vulnerabilities. CI and final commit are reported in the delivery response. Source formatting did not change behavior.

## Limits

Touch was simulated on desktop Chrome, not a physical device. Safari/Firefox and screen reader output were not exercised. Arcade spring/wind and switch contact distance are intentionally simplified. No real gears, ropes, levers, fluids or motors. Saved corruption and future schemas were tested at the decoder seam rather than injected into Chrome storage; raw DOMStorage commands were unsupported, so no storage inspection workaround was used.

The final production-preview browser pass verified a four-part sandbox, reset of both starting balls, rejected x=0 placement with restoration to x=200, sound mute, and a fresh notebook that persisted 0/6 completion and 0 placed parts after reload. The previously completed notebook remains archived through supported game controls. Final standards re-review found no blocking findings; its minor archive-status caveat was corrected to check storage results and report visit-only recovery accurately.

# Copper & Cogs acceptance specification

Delegated decisions: original cozy mechanical workshop; TypeScript/Vite/SVG and Matter.js; six open campaign challenges plus unlimited sandbox; no services or deployment. Test seams accepted by delegation: Editor commands, Simulation advancement and physical goals, saved-data decoding, and real DOM input controls.

- Select limited parts, snap to a 10px grid, drag, nudge, rotate, return to drawer; inventory is conserved.
- Reject out-of-bounds and intersecting solid placements. Fans may overlap their airflow areas; goal/switch areas are fixtures.
- Commit drag only on release; interrupted drag leaves saved design intact. Invalid movement restores the previous pose.
- Undo/redo restores whole designs. Selection never mutates fixed starting balls.
- Editing is unavailable in running or paused mode. Reset reconstructs the exact design. Pause/resume preserves the current world.
- Fixed 120 Hz steps with a 50ms frame cap. Hidden pages and help pause gameplay.
- Six physical solutions settle a ball in the basket for 30 steps; switch levels require actual proximity contact. No placement-based wins. Award each completion once.
- Two-stage ramp relay and ramp → switch → wind delivery require every stage in regression tests.
- Preserve only versioned designs, completion IDs and sound preference; reject corruption, excessive arrays, invalid coordinates/kinds/IDs, overstock and overlaps. Never save simulated positions.
- Visible buttons support touch; position fields and keyboard commands offer precision. Menus contain no background gameplay. DOM buttons use focus affordances and status announcements. Reduced-motion users receive no decorative animation.
- Responsive presentation, descriptive hints, level selection, persisted progress and a sandbox.
- Original procedural SVG illustrations and synthesized sound; no commercial assets.
- Tests, typecheck, production build, audit, browser playthrough and independent standards/spec review pass before delivery.

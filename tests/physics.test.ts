import { it, expect } from "vitest";
import { levels } from "../src/levels";
import { Simulation } from "../src/physics";
it("every campaign has a physical solution and empty designs fail", () => {
  for (const l of levels.slice(0, 6)) {
    const s = new Simulation(
      l,
      l.solution.map((p, i) => ({ ...p, id: `p${i}` })),
    );
    for (let i = 0; i < 1800 && !s.won; i++) s.step();
    expect(s.won, l.id).toBe(true);
    const empty = new Simulation(l, []);
    for (let i = 0; i < 1800; i++) empty.step();
    expect(empty.won, l.id + " empty").toBe(false);
  }
});
it("fresh runs reproduce identical trajectories and bounded frame time", () => {
  const l = levels[0],
    parts = l.solution.map((p, i) => ({ ...p, id: `p${i}` }));
  const a = new Simulation(l, parts),
    b = new Simulation(l, parts);
  for (let i = 0; i < 200; i++) {
    a.step();
    b.step();
  }
  expect(a.positions()).toEqual(b.positions());
  const before = a.ticks;
  a.advance(5000);
  expect(a.ticks - before).toBeLessThanOrEqual(6);
});
it("multi-stage challenges fail with either essential stage removed", () => {
  for (const l of [levels[3], levels[5]])
    for (let missing = 0; missing < 2; missing++) {
      const s = new Simulation(
        l,
        l.solution
          .filter((_, i) => i !== missing)
          .map((p, i) => ({ ...p, id: `p${i}` })),
      );
      for (let i = 0; i < 1800; i++) s.step();
      expect(s.won, `${l.id} stage ${missing}`).toBe(false);
    }
});
it("a run never changes a design and rebuilding restores starting bodies", () => {
  const l = levels[1],
    parts = l.solution.map((p, i) => ({ ...p, id: `p${i}` })),
    copy = structuredClone(parts);
  const s = new Simulation(l, parts);
  for (let i = 0; i < 100; i++) s.advance(16);
  expect(parts).toEqual(copy);
  s.dispose();
  const fresh = new Simulation(l, parts);
  expect(fresh.bodies.get("fixed-0")!.position).toEqual({ x: 260, y: 100 });
});
it("airflow transfers more motion to the light rubber ball than the steel marble", () => {
  const base = { ...levels[6], target: { x: 800, y: 520 } };
  const fan = { id: "fan", kind: "fan" as const, x: 150, y: 250, angle: 0 };
  const rubber = new Simulation(base, [
    fan,
    { id: "ball", kind: "rubber", x: 280, y: 100, angle: 0 },
  ]);
  const steel = new Simulation(base, [
    fan,
    { id: "ball", kind: "steel", x: 280, y: 100, angle: 0 },
  ]);
  for (let i = 0; i < 100; i++) {
    rubber.step();
    steel.step();
  }
  expect(rubber.bodies.get("ball")!.position.x).toBeGreaterThan(
    steel.bodies.get("ball")!.position.x + 60,
  );
});
it("all known solution placements obey the same editor bounds and overlap rules", async () => {
  const { Editor } = await import("../src/editor");
  for (const l of levels.slice(0, 6)) {
    const e = new Editor(l);
    for (const p of l.solution)
      expect(e.place(p.kind, p.x, p.y, p.angle), l.id).toBe(true);
  }
});

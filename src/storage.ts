import { levels, type Kind, type Part } from "./levels";
import { Editor } from "./editor";
export type Save = {
  version: 1;
  completed: string[];
  designs: Record<string, Part[]>;
  muted: boolean;
};
export function decode(raw: string | null): Save {
  const empty: Save = { version: 1, completed: [], designs: {}, muted: false };
  try {
    const s = JSON.parse(raw ?? "null");
    if (s?.version !== 1) return empty;
    const designs: Record<string, Part[]> = {};
    for (const l of levels) {
      const parts = s.designs?.[l.id];
      if (!Array.isArray(parts) || parts.length > 50) continue;
      const clean = parts.filter(
        (p: Part) =>
          p &&
          typeof p.id === "string" &&
          /^[a-zA-Z0-9_-]{1,80}$/.test(p.id) &&
          ["ramp", "spring", "fan", "steel", "rubber"].includes(
            p.kind as Kind,
          ) &&
          [p.x, p.y, p.angle].every(Number.isFinite) &&
          Math.abs(p.angle) <= 360,
      );
      const e = new Editor(l);
      e.load(clean);
      designs[l.id] = e.parts;
    }
    return {
      version: 1,
      designs,
      completed: Array.isArray(s.completed)
        ? [
            ...new Set<string>(
              s.completed
                .slice(0, 100)
                .filter((id: string) =>
                  levels.some((l) => l.id === id && id !== "sandbox"),
                ),
            ),
          ]
        : [],
      muted: s.muted === true,
    };
  } catch {
    return empty;
  }
}
export function readSave(key = "copper-cogs-v1") {
  try {
    return decode(localStorage.getItem(key));
  } catch {
    return decode(null);
  }
}
export function writeSave(s: Save, key = "copper-cogs-v1") {
  try {
    localStorage.setItem(key, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

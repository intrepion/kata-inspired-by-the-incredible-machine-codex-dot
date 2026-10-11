import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 5182;
const busy = await new Promise((resolve) => {
  const s = net.connect({ host: "127.0.0.1", port });
  s.on("connect", () => {
    s.destroy();
    resolve(true);
  });
  s.on("error", () => resolve(false));
});
if (busy) {
  console.log(
    `Port ${port} is already in use. No process started. Open http://127.0.0.1:${port}/ if this is the workshop.`,
  );
  process.exit(0);
}
if (!fs.existsSync(path.join(root, "dist/index.html"))) {
  console.error("Run npm run build first.");
  process.exit(1);
}
const log = path.join(os.tmpdir(), "copper-cogs-5182.log");
const fd = fs.openSync(log, "a");
const child = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, detached: true, stdio: ["ignore", fd, fd] },
);
child.unref();
fs.closeSync(fd);
fs.writeFileSync(
  path.join(os.tmpdir(), "copper-cogs-5182.pid"),
  String(child.pid),
);
console.log(
  `Copper & Cogs: http://127.0.0.1:${port}/\nSession process: ${child.pid}\nLog: ${log}\nNo boot or login startup was installed.`,
);

import { spawn } from "node:child_process";
import { watch } from "chokidar";
import { buildLibrary } from "./library-builder.mjs";

let timer;
let building = false;
let rebuildRequested = false;

async function rebuild() {
  if (building) {
    rebuildRequested = true;
    return;
  }
  building = true;
  try {
    await buildLibrary();
  } catch (error) {
    console.error("Library rebuild failed:", error);
  } finally {
    building = false;
    if (rebuildRequested) {
      rebuildRequested = false;
      await rebuild();
    }
  }
}

await buildLibrary();
const watcher = watch("library", { ignoreInitial: true, awaitWriteFinish: true });
watcher.on("all", () => {
  clearTimeout(timer);
  timer = setTimeout(() => void rebuild(), 250);
});
watcher.on("error", (error) => console.error("Library watcher failed:", error));

const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev"], {
  stdio: "inherit",
  env: process.env,
});

next.on("exit", (code) => {
  void watcher.close();
  process.exitCode = code ?? 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    next.kill(signal);
    void watcher.close();
  });
}

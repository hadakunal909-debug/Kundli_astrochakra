#!/usr/bin/env node
/*
 * Builds a self-contained Next.js bundle for cPanel ("Setup Node.js App").
 *
 * Output: web/.next/standalone/  — contains node_modules/, package.json and
 * web/server.js. That whole folder is what gets shipped to the cPanel app root
 * (startup file = web/server.js). See docs/DEPLOY-CPANEL-CI.md.
 *
 * Cross-platform (Node 18+). Used by both `npm run build:cpanel` locally and the
 * GitHub Actions workflow, so the two always produce the same artifact.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
};

// 1. Build the calc library (tsc -> dist/). web/ depends on it via file:..,
//    so this must run before the web build picks it up.
run("npm run build");

// 2. Build the Next.js app in standalone mode.
run("npm run build --workspace=web");

const standalone = join(root, "web", ".next", "standalone");
if (!existsSync(standalone)) {
  throw new Error(
    'standalone build missing — confirm output:"standalone" is set in web/next.config.js',
  );
}

// 3. Next does NOT copy static assets / public into the standalone output.
//    Copy them in so the server can serve CSS, JS chunks and public files.
const copy = (from, to) => {
  if (!existsSync(from)) return;
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`copied ${from} -> ${to}`);
};
copy(join(root, "web", ".next", "static"), join(standalone, "web", ".next", "static"));
copy(join(root, "web", "public"), join(standalone, "web", "public"));

console.log(`\n✓ cPanel bundle ready: ${standalone}`);
console.log("  Ship the CONTENTS of that folder to your cPanel app root.");

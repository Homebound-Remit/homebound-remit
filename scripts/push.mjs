/**
 * push.mjs — commit all changes and push to origin/main
 * Usage: node scripts/push.mjs "optional commit message"
 */
import { execSync } from "child_process";

const cwd = "C:/Users/User/Desktop/HOMEBOUND";
const run = (cmd) => {
  console.log(`> ${cmd}`);
  const out = execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe" });
  if (out?.trim()) console.log(out.trim());
  return out ?? "";
};

const msg = process.argv[2] ?? "chore: update";

run("git add -A");
const status = run("git status -s");
if (!status.trim()) { console.log("Nothing to commit."); process.exit(0); }
run(`git commit -m "${msg}"`);
run("git push origin main");
console.log("\n✅ Pushed → https://github.com/Homebound-Remit/homebound-remit");

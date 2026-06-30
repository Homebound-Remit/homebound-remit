import { execSync } from "child_process";

const run = (cmd) => {
  console.log(`> ${cmd}`);
  const out = execSync(cmd, { cwd: "C:/Users/User/Desktop/HOMEBOUND", encoding: "utf8", stdio: "pipe" });
  if (out.trim()) console.log(out.trim());
};

try {
  run("git add -A");
  const status = execSync("git status --short", { cwd: "C:/Users/User/Desktop/HOMEBOUND", encoding: "utf8" });
  console.log("Staged:\n" + status);
  if (!status.trim()) { console.log("Nothing to commit."); process.exit(0); }
  run(`git commit -m "chore: add CI, LICENSE, SECURITY, CHANGELOG, issue templates, badges"`);
  run("git push origin main");
  console.log("\n✅ Pushed to https://github.com/Homebound-Remit/homebound-remit");
} catch (e) {
  console.error("❌", e.stderr ?? e.message);
  process.exit(1);
}

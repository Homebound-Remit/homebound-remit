import { execSync } from "child_process";

const run = (cmd, opts = {}) => {
  console.log(`> ${cmd}`);
  const out = execSync(cmd, {
    cwd: "C:/Users/User/Desktop/HOMEBOUND",
    encoding: "utf8",
    stdio: "pipe",
    ...opts,
  });
  if (out?.trim()) console.log(out.trim());
  return out ?? "";
};

try {
  // Stage everything not in .gitignore
  run("git add -A");

  // Show what will be committed
  const status = run("git status --short");
  if (!status.trim()) {
    console.log("✅ Nothing to commit — repo is up to date.");
    process.exit(0);
  }

  // Commit
  run(`git commit -m "chore: add CI workflow, LICENSE, SECURITY, CHANGELOG, issue templates, PR template, README badges"`);

  // Push
  run("git push origin main");

  console.log("\n✅ Pushed → https://github.com/Homebound-Remit/homebound-remit");
} catch (e) {
  console.error("❌", e.stderr?.toString() ?? e.message);
  process.exit(1);
}

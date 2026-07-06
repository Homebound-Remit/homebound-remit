import { execSync } from "child_process";
const cwd = "C:/Users/User/Desktop/HOMEBOUND";
const run = (cmd) => {
  console.log(`> ${cmd}`);
  const out = execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe" });
  if (out?.trim()) console.log(out.trim());
};

const tag     = process.argv[2] ?? "v0.1.0";
const message = process.argv[3] ?? `Release ${tag}`;

try {
  run(`git tag -a ${tag} -m "${message}"`);
  run(`git push origin ${tag}`);
  console.log(`\n✅ Tag ${tag} pushed → https://github.com/Homebound-Remit/homebound-remit/releases/tag/${tag}`);
} catch (e) {
  if (e.stderr?.includes("already exists")) {
    console.log(`Tag ${tag} already exists — pushing it.`);
    run(`git push origin ${tag}`);
  } else {
    console.error("❌", e.stderr ?? e.message);
    process.exit(1);
  }
}

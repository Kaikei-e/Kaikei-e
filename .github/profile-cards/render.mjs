// github-readme-stats-core を lockfile 固定で使い、stats / top-langs カードを描画する
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as core from "@stats-organization/github-readme-stats-core";

const owner = process.env.OWNER ?? "";
const outDir = process.argv[2];

// GitHub のユーザー名として妥当な文字だけ許可する
if (!/^[A-Za-z0-9-]{1,39}$/.test(owner)) {
  throw new Error("OWNER is missing or invalid");
}
if (!outDir) {
  throw new Error("usage: node render.mjs <output-dir>");
}

// 値はすべて文字列で渡す（アクション本体と同じ扱い）。
// 2.2.0 からは theme_light / theme_dark で1枚の SVG がライト/ダークに追従する
const theme = { hide_border: "true", theme_light: "light_github", theme_dark: "dark_github" };
const cards = [
  { name: "top-langs.svg", render: core.topLangs, query: { username: owner, layout: "compact", langs_count: "8", ...theme } },
];

await mkdir(outDir, { recursive: true });

for (const { name, render, query } of cards) {
  if (typeof render !== "function") {
    throw new Error(`core does not export the renderer for ${name}`);
  }
  // core はデータ取得に失敗しても例外を投げず、status が "error" で始まる結果を返す
  const result = await render(query);
  if (String(result?.status).startsWith("error")) {
    throw new Error(`${name}: ${result.status}`);
  }
  if (!result?.content) {
    throw new Error(`${name}: empty output`);
  }
  await writeFile(path.join(outDir, name), result.content, "utf8");
  console.log(`wrote ${name}`);
}
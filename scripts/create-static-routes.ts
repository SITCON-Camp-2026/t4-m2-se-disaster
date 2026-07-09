import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist/v1", { recursive: true });
copyFileSync("dist/index.html", "dist/v1/index.html");
copyFileSync("dist/index.html", "dist/404.html");

console.log("Created static entries: dist/v1/index.html, dist/404.html");

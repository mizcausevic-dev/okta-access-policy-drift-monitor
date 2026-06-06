#!/usr/bin/env node
import { loadMonitor, renderMarkdown } from "../src/index.js";

const [, , inputPath, formatFlag, format] = process.argv;

if (!inputPath) {
  console.error("Usage: okta-access-policy-drift-monitor <input.json> [--format markdown|json]");
  process.exit(1);
}

const monitor = await loadMonitor(inputPath);
console.log(formatFlag === "--format" && format === "json" ? JSON.stringify(monitor, null, 2) : renderMarkdown(monitor));

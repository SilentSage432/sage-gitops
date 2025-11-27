#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const federationPath = path.join(os.homedir(), ".sage-federation");

function saveTokenEnvelope(env) {
  fs.writeFileSync(federationPath, JSON.stringify(env, null, 2));
  console.log("✔ Federation identity installed.");
}

function loadTokenEnvelope() {
  if (!fs.existsSync(federationPath)) return null;
  return JSON.parse(fs.readFileSync(federationPath, "utf-8"));
}

function showStatus() {
  const env = loadTokenEnvelope();
  if (!env) {
    console.log("No federation identity found.");
    return;
  }
  console.log("Federated as:", env.source);
}

if (require.main === module) {
  const [,, cmd, arg] = process.argv;

  if (cmd === "--token" && arg) {
    saveTokenEnvelope(JSON.parse(arg));
  } else if (cmd === "status") {
    showStatus();
  } else {
    console.log("Usage: federation.js --token '<json>' | status");
  }
}

module.exports = {
  saveTokenEnvelope,
  loadTokenEnvelope,
  showStatus,
};

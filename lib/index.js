"use strict";

// src/index.ts
var import_node_https = require("node:https");

// src/action-helper.ts
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var import_node_os = require("node:os");
var getInput = (name, options) => {
  const val = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
  if (options?.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  if (options?.trimWhitespace === false) {
    return val;
  }
  return val.trim();
};
var setOutput = (name, value) => {
  const filePath = process.env["GITHUB_OUTPUT"] || "";
  if (filePath) {
    issueFileCommand("OUTPUT", prepareKeyValueMessage(name, value));
    return;
  }
  process.stdout.write(`${import_node_os.EOL}::set-output name=${name}::${toCommandValue(value)}${import_node_os.EOL}`);
};
var setFailed = (message) => {
  process.exitCode = 1;
  const msg = message instanceof Error ? message.toString() : message;
  process.stdout.write(`::error::${escapeData(msg)}${import_node_os.EOL}`);
};
var info = (message) => {
  process.stdout.write(message + import_node_os.EOL);
};
var toCommandValue = (input) => {
  if (input === null || input === void 0) {
    return "";
  }
  if (typeof input === "string") {
    return input;
  }
  return JSON.stringify(input);
};
var escapeData = (s) => toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
var issueFileCommand = (command, message) => {
  const filePath = process.env[`GITHUB_${command}`];
  if (!filePath) {
    throw new Error(`Unable to find environment variable for file command ${command}`);
  }
  if (!(0, import_node_fs.existsSync)(filePath)) {
    throw new Error(`Missing file at path: ${filePath}`);
  }
  (0, import_node_fs.appendFileSync)(filePath, `${message}${import_node_os.EOL}`, { encoding: "utf8" });
};
var prepareKeyValueMessage = (key, value) => {
  const delimiter = `ghadelimiter_${(0, import_node_crypto.randomUUID)()}`;
  const convertedValue = toCommandValue(value);
  if (key.includes(delimiter)) {
    throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
  }
  if (convertedValue.includes(delimiter)) {
    throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
  }
  return `${key}<<${delimiter}${import_node_os.EOL}${convertedValue}${import_node_os.EOL}${delimiter}`;
};

// src/index.ts
var getCertificate = async (url) => new Promise((resolve, reject) => {
  (0, import_node_https.get)(url, { agent: false }, (response) => resolve(response.socket.getPeerCertificate(false))).on("error", (err) => reject(err));
});
var main = async () => {
  const maxCertExpireDaysLeft = parseInt(getInput("max-cert-expire-days-left"));
  const url = new URL(getInput("url", { required: true }));
  const { valid_to: certExpireDate } = await getCertificate(url);
  const certExpireDaysLeft = Math.floor((Date.parse(certExpireDate) - (/* @__PURE__ */ new Date()).getTime()) / (1e3 * 60 * 60 * 24));
  const certExpireMessage = `Certificate for ${url.host} is valid until "${certExpireDate}" hence it will expire in ${certExpireDaysLeft} days`;
  info(certExpireMessage);
  setOutput("cert-expire-date", certExpireDate);
  setOutput("cert-expire-days-left", certExpireDaysLeft);
  if (certExpireDaysLeft <= maxCertExpireDaysLeft) {
    setFailed(certExpireMessage);
  }
};
main().catch((error) => {
  setFailed("unhandled error " + JSON.stringify(error));
});

"use strict";
const { readFileSync } = require("fs");
const { XSSScanner } = require("../dist/XSSScanner");
const vulnCode = readFileSync("./xss-payload-list", { encoding: "utf8", flag: "r" }).split("\n").slice(7);
//console.log(vulnCode);
// randomly select one line in vulnCode
const randomLine = vulnCode[Math.floor(Math.random() * vulnCode.length)];
console.log(randomLine);
const scanner = new XSSScanner();
const findings = scanner.scanContent(randomLine);
console.log(findings);

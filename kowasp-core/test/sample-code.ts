const {readFileSync} = require("fs");
const {XSSScanner} = require("../dist/XSSScanner");

const vulnCode: Array<string> = readFileSync("./xss-payload-list", {encoding: "utf8", flag: "r"}).split("\n").slice(7);
//console.log(vulnCode);
// randomly select one line in vulnCode
const randomLine: string = vulnCode[Math.floor(Math.random() * vulnCode.length)];
console.log(randomLine);

const scanner = new XSSScanner();
const findings = scanner.scanContent(randomLine);
console.log(findings);

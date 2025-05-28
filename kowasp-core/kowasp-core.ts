// kowasp-core
// Can be used for educational purposes only

import {readFileSync} from "fs";
import {Program} from "estree";
import {parse} from 'yaml';
import * as estraverse from "estraverse";
import * as esprima from "esprima";

// Step 1: Syntactic Analysis
// Identify tokens
// Determine its a script or a module
//const vulCode: string = 'eval(alert("XSS"))';
//const moduleExample: string = 'import { sqrt } from "math.js"';
//console.log(esprima.parseScript(vulCode));
//console.log(esprima.parseModule(moduleExample));

// Step 2: Lexical Analysis
// Identify the meaning of each token
//const tokens = esprima.tokenize(vulCode);
//console.log(tokens);
// Build an Abstract Syntax Tree (AST)
// Identify the structure of the code
//let ast: Program = esprima.parseScript(vulCode);
//console.log(ast);

// Step 3: Semantic Analysis
// Identify the meaning of the AST
// Check if the code is vulnerable
//let isVulnerable = "Yes";

// Step 4: Output the report
//(function showReport(vulCode, isVulnerable) {
  //return `
 //-------------
 //KOwasp-XSS Report
 //-------------
 //Code: ${vulCode}
 //Vulnerable: ${isVulnerable ? 'Yes' : 'No'}
 //-------------
 //Summary: Eval function is used with alert function which is vulnerable to XSS attacks
 //-------------
 //Recommendations: Use a Content Security Policy (CSP) to prevent XSS attacks
 //-------------
//`})(vulCode, isVulnerable);

// Main Entry Point
(function main() {

  // html vulnerable code
  const payloads: Array<string> = readFileSync("./test/xss-payload-list", {encoding: "utf-8", flag: "r"}).split("\n").slice(7);
  const payload: string = payloads[Math.floor(Math.random() * payloads.length)];
  console.log(payload);

  // javascript code rules
  const filePaths = ["./xss/xss_node.yaml","./xss/xss_mustache_escape.yaml","./xss/xss_serialize_js.yaml","./xss/xss_templates.yaml" ]
  const rules = filePaths.map((filePath) => {
    const fileContent = readFileSync(filePath, 'utf-8');
    return parse(fileContent).rules[0];
  });
  console.log(rules);

  // build AST (for javascript files)
  //const ast = esprima.parseScript(payload);
  //console.log(ast);

  // perform regex scan (for html files)
  // extract the regex patterns from the rules
  //const patterns: Array<string> = [];

  // pattern is the regex pattern, patterns could have pattern-either, pattern-inside or pattern-not-inside
  //for (const rule of rules) {
    //for (const pattern of rule.patterns) {
      //if (pattern.pattern) {
        //patterns.push(pattern.pattern);
      //}
      //if (pattern['pattern-inside']) {
        //patterns.push(pattern['pattern-inside']);
      //}
      //if (pattern['pattern-not-inside']) {
        //patterns.push(pattern['pattern-not-inside']);
      //}
      //if (pattern['pattern-either']) {
        //patterns.push(...pattern['pattern-either'].flatMap(p => p.pattern));
      //}
      //if (pattern['pattern-not']) {
        //patterns.push(...pattern['pattern-not'].flatMap(p => p.pattern));
      //}
    //}
  //}


  // traverse AST and compare it with rules
  //estraverse.traverse(ast, {
    //enter: function (node) {
      //// 
    //}
  //});


  //const patterns: Array<Object> = [];

  //for (let rule of rules) {
    ////console.log(rule);
    //if (rule.pattern) {
      //const pattern: Object = {
        //name: rule.name,
        //description: rule.description,
        //severity: rule.severity,
        //pattern: rule.pattern,
        //example: rule.example
      //};
      //patterns.push(pattern);
    //}
    //if (rule.patterns) {
      //for (let pattern of rule.patterns) {
        //const p: Object = {
          //name: pattern.name,
          //description: pattern.description,
          //severity: pattern.severity,
          //pattern: pattern.pattern,
          //example: pattern.example
        //};
        //patterns.push(p);
      //}
    //}
  //}
  //console.log(patterns)

  //for (const pattern of patterns) {
    //const regex = new RegExp(pattern.pattern, 'gi');
    //let match;

    //while ((match = regex.exec(payload)) !== null) {
      //const finding: XSSFinding = {
        //pattern_name: pattern.name,
        //description: pattern.description,
        //severity: pattern.severity,
        //matched_text: match[0],
        //position: [match.index, match.index + match[0].length],
        //example: pattern.example
      //};
      //findings.push(finding);
    //}
  //}
  //console.log(findings);
})();

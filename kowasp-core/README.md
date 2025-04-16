### KOwasp Core

A command line tool that detects security vulnerabilities in web applications. <br />

#### Procedure

1. Syntactic Analysis - Identify tokens
    - [EsprimaJS](https://docs.esprima.org/en/4.0/syntactic-analysis.html)
2. Lexical Analysis - Identify the meaning of each token
    - [EsprimaJS](https://docs.esprima.org/en/4.0/lexical-analysis.html)
3. Build an Abstract Syntax Tree (AST) - Identify the structure of the code
    - [ESTree AST Spec](https://github.com/estree/estree/blob/master/es2025.md)
    - [Esprima AST Format](https://docs.esprima.org/en/4.0/syntax-tree-format.html)
4. Semantic Analysis - Identify the meaning of the AST, check if the code is vulnerable
    - [Semgrep Rules](https://github.com/semgrep/semgrep-rules)

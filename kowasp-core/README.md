# KOWASP XSS Analyzer

A powerful XSS vulnerability analyzer for ExpressJS applications that combines AST-based code parsing, pattern matching, and AI-powered context-aware analysis.

## Features

- AST-based code parsing using esprima and estraverse
- Pattern matching against OWASP XSS Cheatsheet rules
- ExpressJS configuration analysis
- Context-aware analysis using Ollama (local LLM)
- Detailed vulnerability reports with remediation suggestions
- Security header analysis
- Confidence scoring for findings

## Prerequisites

- Node.js 16+
- Ollama with Mistral model installed and running locally

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kowasp.git
cd kowasp
```

2. Install dependencies:
```bash
npm install
```

3. Make sure Ollama is running with the Mistral model:
```bash
ollama run mistral
```

## Usage

Analyze an ExpressJS application:

```bash
npm run analyze -- /path/to/your/express/app
```

Or build and run directly:

```bash
npm run build
node dist/index.js /path/to/your/express/app
```

## Output

The analyzer will provide:

1. XSS Vulnerabilities
   - Type (reflected, stored, DOM-based, etc.)
   - Severity
   - Location (file and line number)
   - Description
   - Code snippet
   - Remediation suggestion
   - Confidence score

2. Express Security Configuration
   - Helmet usage
   - Content Security Policy
   - XSS Filter
   - No Sniff
   - Frame Guard
   - HSTS

3. Missing Security Headers
   - List of recommended security headers

4. Recommendations
   - Specific actions to improve security

## Example

```bash
$ npm run analyze -- ./examples/vulnerable-app

Starting XSS analysis...
Target directory: ./examples/vulnerable-app

Analysis Results:
==================

XSS Vulnerabilities Found:
[HIGH] reflected XSS
Location: app.js:15
Description: Unencoded user input directly reflected in response
Code: res.send(`<h1>Search Results</h1><p>You searched for: ${searchTerm}</p>`);
Remediation: Use proper output encoding (e.g., xss package) before sending response
Confidence: 95.0%

Express Security Configuration:
=============================
Helmet: ✗
Content Security Policy: ✗
XSS Filter: ✗
No Sniff: ✗
Frame Guard: ✗
HSTS: ✗

Missing Security Headers:
- Content-Security-Policy
- X-XSS-Protection
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security

Recommendations:
- Install and configure helmet middleware for security headers
- Configure Content Security Policy using helmet.contentSecurityPolicy()
- Enable XSS protection using helmet.xssFilter()
- Enable X-Content-Type-Options using helmet.noSniff()
- Configure frame protection using helmet.frameguard()
- Enable HSTS using helmet.hsts()
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

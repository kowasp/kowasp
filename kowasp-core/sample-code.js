const { XSSScanner } = require('./dist/index');

// Sample line of code to scan
const randomLine = '<script>alert("Hello, World!");</script>';

// Create a new scanner instance
// Note: If you want to use LLM analysis, provide your OpenAI API key as an argument
const scanner = new XSSScanner();

// Scan the content
const findings = scanner.scanContent(randomLine);

// Display the results
scanner.displayResults(findings);

// If you want to use LLM analysis, you can do:
// const enhancedFindings = await scanner.evaluateWithLLM(findings);
// scanner.displayResults(enhancedFindings); 
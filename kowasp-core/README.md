# Kowasp Core - XSS Scanner

A powerful XSS (Cross-Site Scripting) vulnerability scanner that combines regex-based pattern matching with LLM-powered analysis for enhanced accuracy.

## Features

- Regex-based XSS pattern matching
- LLM-powered analysis for reducing false positives
- Support for scanning files and URLs
- Beautiful CLI output with detailed findings
- Configurable severity levels
- Extensible pattern database

## Installation

```bash
npm install
npm run build
```

## Usage

### Scan a File

```bash
# Basic scan without LLM analysis
npm start scan -f path/to/file.html

# Scan with LLM analysis
npm start scan -f path/to/file.html -k your-openai-api-key
```

### Scan a URL

```bash
# Basic scan without LLM analysis
npm start scan-url -u https://example.com

# Scan with LLM analysis
npm start scan-url -u https://example.com -k your-openai-api-key
```

## Output

The scanner provides detailed output for each finding, including:

- Pattern name and description
- Severity level
- Matched text
- Position in the content
- LLM analysis (if enabled)
  - True/False positive determination
  - Confidence level
  - Explanation
  - Recommendation

## Adding Custom Patterns

You can add custom XSS patterns by editing the `patterns/xss_patterns.json` file. Each pattern should follow this structure:

```json
{
    "name": "Pattern Name",
    "pattern": "regex pattern",
    "description": "Pattern description",
    "severity": "High|Medium|Low",
    "example": "Example of the pattern"
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT

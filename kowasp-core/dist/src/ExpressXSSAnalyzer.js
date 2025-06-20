"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressXSSAnalyzer = void 0;
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
class ExpressXSSAnalyzer {
    constructor() {
        this.OWASP_GUIDELINES = {
            CONTENT_SECURITY_POLICY: 'Content-Security-Policy',
            X_XSS_PROTECTION: 'X-XSS-Protection',
            X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
            X_FRAME_OPTIONS: 'X-Frame-Options',
            HELMET: 'helmet',
            EXPRESS_SANITIZER: 'express-sanitizer',
            CORS: 'cors',
            COOKIE_SECURITY: 'cookie-security',
            INPUT_VALIDATION: 'input-validation',
            OUTPUT_ENCODING: 'output-encoding'
        };
    }
    analyzeExpressApp(sourceCode) {
        const findings = [];
        // Parse the source code
        const ast = (0, parser_1.parse)(sourceCode, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });
        // Check for security middleware and configurations
        this.checkSecurityMiddleware(ast, findings);
        this.checkInputValidation(ast, findings);
        this.checkOutputEncoding(ast, findings);
        this.checkCookieSecurity(ast, findings);
        this.checkCSPImplementation(ast, findings);
        return findings;
    }
    checkSecurityMiddleware(ast, findings) {
        let hasHelmet = false;
        let hasSanitizer = false;
        let hasCors = false;
        (0, traverse_1.default)(ast, {
            ImportDeclaration(path) {
                const source = path.node.source.value;
                if (source === 'helmet')
                    hasHelmet = true;
                if (source === 'express-sanitizer')
                    hasSanitizer = true;
                if (source === 'cors')
                    hasCors = true;
            },
            CallExpression(path) {
                const node = path.node;
                if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
                    const arg = node.arguments[0];
                    if (arg.type === 'StringLiteral') {
                        if (arg.value === 'helmet')
                            hasHelmet = true;
                        if (arg.value === 'express-sanitizer')
                            hasSanitizer = true;
                        if (arg.value === 'cors')
                            hasCors = true;
                    }
                }
            }
        });
        if (!hasHelmet) {
            findings.push({
                pattern_name: 'Missing Helmet',
                description: 'Helmet middleware is not implemented. Helmet helps secure Express apps by setting various HTTP headers.',
                severity: 'High',
                matched_text: '',
                position: [0, 0],
                example: `import helmet from 'helmet';\napp.use(helmet());`
            });
        }
        if (!hasSanitizer) {
            findings.push({
                pattern_name: 'Missing Sanitizer',
                description: 'Express-sanitizer middleware is not implemented. It helps sanitize user input.',
                severity: 'High',
                matched_text: '',
                position: [0, 0],
                example: `import expressSanitizer from 'express-sanitizer';\napp.use(expressSanitizer());`
            });
        }
        if (!hasCors) {
            findings.push({
                pattern_name: 'Missing CORS',
                description: 'CORS middleware is not implemented. It helps control cross-origin requests.',
                severity: 'Medium',
                matched_text: '',
                position: [0, 0],
                example: `import cors from 'cors';\napp.use(cors());`
            });
        }
    }
    checkInputValidation(ast, findings) {
        let hasValidation = false;
        let hasExpressValidator = false;
        (0, traverse_1.default)(ast, {
            ImportDeclaration(path) {
                const source = path.node.source.value;
                if (source === 'express-validator')
                    hasExpressValidator = true;
            },
            CallExpression(path) {
                const node = path.node;
                if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
                    const arg = node.arguments[0];
                    if (arg.type === 'StringLiteral' && arg.value === 'express-validator') {
                        hasExpressValidator = true;
                    }
                }
            }
        });
        if (!hasExpressValidator) {
            findings.push({
                pattern_name: 'Missing Input Validation',
                description: 'Express-validator is not implemented. Input validation is crucial for preventing XSS attacks.',
                severity: 'High',
                matched_text: '',
                position: [0, 0],
                example: `import { body, validationResult } from 'express-validator';\napp.post('/user', [\n  body('email').isEmail(),\n  body('password').isLength({ min: 6 })\n], (req, res) => {\n  const errors = validationResult(req);\n  if (!errors.isEmpty()) {\n    return res.status(400).json({ errors: errors.array() });\n  }\n  // ...\n});`
            });
        }
    }
    checkOutputEncoding(ast, findings) {
        let hasEscapeHtml = false;
        let hasXss = false;
        (0, traverse_1.default)(ast, {
            ImportDeclaration(path) {
                const source = path.node.source.value;
                if (source === 'escape-html')
                    hasEscapeHtml = true;
                if (source === 'xss')
                    hasXss = true;
            }
        });
        if (!hasEscapeHtml && !hasXss) {
            findings.push({
                pattern_name: 'Missing Output Encoding',
                description: 'No HTML encoding library is implemented. Output encoding is essential for preventing XSS attacks.',
                severity: 'High',
                matched_text: '',
                position: [0, 0],
                example: `import escapeHtml from 'escape-html';\n// or\nimport xss from 'xss';\n\n// Use in your routes:\nres.send(escapeHtml(userInput));\n// or\nres.send(xss(userInput));`
            });
        }
    }
    checkCookieSecurity(ast, findings) {
        let hasSecureCookies = false;
        (0, traverse_1.default)(ast, {
            CallExpression(path) {
                const node = path.node;
                if (node.callee.type === 'MemberExpression' &&
                    node.callee.property.type === 'Identifier' &&
                    node.callee.property.name === 'cookie') {
                    const options = node.arguments[2];
                    if (options && options.type === 'ObjectExpression') {
                        const secure = options.properties.find((prop) => prop.key.name === 'secure' && prop.value.value === true);
                        const httpOnly = options.properties.find((prop) => prop.key.name === 'httpOnly' && prop.value.value === true);
                        if (secure && httpOnly) {
                            hasSecureCookies = true;
                        }
                    }
                }
            }
        });
        if (!hasSecureCookies) {
            findings.push({
                pattern_name: 'Insecure Cookie Configuration',
                description: 'Cookies are not configured with secure and httpOnly flags.',
                severity: 'High',
                matched_text: '',
                position: [0, 0],
                example: `res.cookie('sessionId', 'value', {\n  secure: true,\n  httpOnly: true,\n  sameSite: 'strict'\n});`
            });
        }
    }
    checkCSPImplementation(ast, findings) {
        let hasCSP = false;
        (0, traverse_1.default)(ast, {
            CallExpression(path) {
                const node = path.node;
                if (node.callee.type === 'MemberExpression' &&
                    node.callee.property.type === 'Identifier' &&
                    node.callee.property.name === 'use') {
                    const arg = node.arguments[0];
                    if (arg.type === 'CallExpression' &&
                        arg.callee.type === 'Identifier' &&
                        arg.callee.name === 'helmet') {
                        hasCSP = true;
                    }
                }
            }
        });
        if (!hasCSP) {
            findings.push({
                pattern_name: 'Missing Content Security Policy',
                description: 'Content Security Policy is not implemented. CSP helps prevent XSS attacks by controlling resource loading.',
                severity: 'High',
                matched_text: '',
                position: [0, 0],
                example: `app.use(helmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: ["'self'"],\n    scriptSrc: ["'self'"],\n    styleSrc: ["'self'"],\n    imgSrc: ["'self'"],\n    connectSrc: ["'self'"]\n  }\n}));`
            });
        }
    }
    displayResults(findings) {
        console.log('\nExpressJS XSS Security Analysis Results:');
        console.log('='.repeat(80));
        for (const finding of findings) {
            console.log(`\nPattern: ${finding.pattern_name}\nSeverity: ${finding.severity}\nDescription: ${finding.description}\nExample: ${finding.example}\n${'-'.repeat(80)}`);
        }
    }
}
exports.ExpressXSSAnalyzer = ExpressXSSAnalyzer;

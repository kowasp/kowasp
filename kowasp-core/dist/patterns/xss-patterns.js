"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xssPatterns = void 0;
exports.xssPatterns = [
    {
        id: 'reflected-1',
        name: 'Basic Reflected XSS',
        description: 'Unencoded user input directly reflected in response',
        pattern: 'res\\.(send|render|json)\\([^)]*\\$\\{.*\\}[^)]*\\)',
        severity: 'high',
        category: 'reflected',
        remediation: 'Use proper output encoding (e.g., xss package) before sending response'
    },
    {
        id: 'stored-1',
        name: 'Stored XSS in Database',
        description: 'Unencoded user input stored and later displayed',
        pattern: 'db\\.(insert|update)\\([^)]*\\$\\{.*\\}[^)]*\\)',
        severity: 'high',
        category: 'stored',
        remediation: 'Encode data before storing and displaying'
    },
    {
        id: 'dom-1',
        name: 'DOM-based XSS',
        description: 'Unsafe DOM manipulation with user input',
        pattern: 'document\\.(getElementById|querySelector)\\([^)]*\\)\\.(innerHTML|outerHTML)',
        severity: 'high',
        category: 'dom',
        remediation: 'Use textContent instead of innerHTML, or sanitize input'
    },
    {
        id: 'event-1',
        name: 'Event Handler XSS',
        description: 'Unsafe event handler attributes',
        pattern: 'on(load|error|click|mouseover)=\\s*["\']\\s*\\$\\{.*\\}',
        severity: 'high',
        category: 'event-handler',
        remediation: 'Avoid inline event handlers, use addEventListener instead'
    },
    {
        id: 'js-url-1',
        name: 'JavaScript URL XSS',
        description: 'Unsafe JavaScript URLs',
        pattern: 'href=["\']javascript:',
        severity: 'high',
        category: 'js-url',
        remediation: 'Validate URLs and use proper URL encoding'
    },
    {
        id: 'filter-evasion-1',
        name: 'Filter Evasion - Case Variation',
        description: 'Case variation to bypass filters',
        pattern: '<(s|S)(c|C)(r|R)(i|I)(p|P)(t|T)',
        severity: 'medium',
        category: 'reflected',
        remediation: 'Use case-insensitive pattern matching'
    },
    {
        id: 'filter-evasion-2',
        name: 'Filter Evasion - HTML Entities',
        description: 'HTML entities to bypass filters',
        pattern: '&#x[0-9a-fA-F]{2};',
        severity: 'medium',
        category: 'reflected',
        remediation: 'Decode HTML entities before filtering'
    },
    {
        id: 'file-upload-1',
        name: 'Insecure File Upload',
        description: 'File upload without proper type validation or filename sanitization.',
        pattern: 'multer|express-fileupload',
        severity: 'high',
        category: 'file-upload',
        remediation: 'Implement strict file type validation (e.g., using a whitelist of allowed extensions and MIME types) and sanitize user-provided filenames to prevent path traversal or other attacks.'
    },
    {
        id: 'nosql-injection-1',
        name: 'NoSQL Injection',
        description: 'User input is used directly in a database query, which could lead to NoSQL injection.',
        pattern: '\\.find\\(|\\.findOne\\(|\\.findOneAndUpdate\\(|\\.update\\(',
        severity: 'high',
        category: 'nosql-injection',
        remediation: 'Sanitize user input before using it in database queries. Use libraries like `mongo-sanitize` or validate input against a strict schema.'
    }
];

import { XSSPattern } from '../types/analyzer';

/**
 * OWASP XSS Prevention Rules - Based on OWASP XSS Prevention Cheat Sheet
 * 
 * Primary Sources:
 * - OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 * - OWASP Testing Guide - XSS: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/02-Testing_for_Reflected_Cross_Site_Scripting
 * - OWASP React Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/React_Security_Cheat_Sheet.html
 * 
 * Key OWASP XSS Prevention Rules:
 * - Rule #1: HTML encode before inserting untrusted data into HTML element content
 * - Rule #2: Attribute encode before inserting untrusted data into HTML common attributes
 * - Rule #3: JavaScript encode before inserting untrusted data into JavaScript data values
 * - Rule #4: CSS encode and validate before inserting untrusted data into HTML style property values
 * - Rule #5: URL encode before inserting untrusted data into HTML URL parameters
 * - Rule #6: Sanitize HTML markup with a library designed for the job
 * - Rule #7: Avoid JavaScript URLs
 */

export const xssPatterns: XSSPattern[] = [
    {
        id: 'reflected-1',
        name: 'Reflected XSS - Direct Output',
        description: 'User input directly reflected in response without proper encoding (OWASP Rule #1)',
        pattern: 'res\\.(?:send|render|json|write)\\s*\\([^)]*\\$\\{[^}]*req\\.(?:query|body|params)[^}]*\\}[^)]*\\)',
        severity: 'high',
        category: 'reflected',
        remediation: 'Use proper output encoding. For HTML context, use HTML entity encoding.'
    },
    {
        id: 'stored-1',
        name: 'Stored XSS - Database Storage',
        description: 'Unencoded user input stored in database and later displayed (OWASP Rule #1)',
        pattern: '(?:db|database|collection)\\.(?:insert|update|save)\\s*\\([^)]*\\$\\{[^}]*\\}[^)]*\\)',
        severity: 'high',
        category: 'stored',
        remediation: 'Encode data before storing and displaying. Use parameterized queries.'
    },
    {
        id: 'dom-1',
        name: 'DOM XSS - innerHTML/outerHTML',
        description: 'Unsafe DOM manipulation with user input using innerHTML or outerHTML (OWASP Rule #2)',
        pattern: '\\.(?:innerHTML|outerHTML)\\s*=\\s*(?:[^;]*\\$\\{[^}]*\\}|[^;]*userInput|[^;]*req\\.)',
        severity: 'high',
        category: 'dom',
        remediation: 'Use .textContent to insert plain text, which is not parsed as HTML.'
    },
    {
        id: 'dom-2',
        name: 'DOM XSS - eval() and Dynamic Code Execution',
        description: 'Using eval(), Function(), setTimeout(), or setInterval() with dynamic data (OWASP Rule #7)',
        pattern: '(?:eval|Function|setTimeout|setInterval)\\s*\\([^)]*(?:\\$\\{|userInput|req\\.|document\\.location)[^)]*\\)',
        severity: 'high',
        category: 'dom',
        remediation: 'Avoid using eval() and Function() with user input.'
    },
    {
        id: 'dom-3',
        name: 'DOM XSS - Location-based',
        description: 'Data from URL components (location.hash, location.search) written to DOM without encoding (OWASP Rule #2)',
        pattern: '(?:document\\.)?location\\.(?:hash|search|href|pathname).*?(?:document\\.write|\\.innerHTML|\\.outerHTML)',
        severity: 'high',
        category: 'dom',
        remediation: 'HTML-encode data from the URL before writing it to the page.'
    },
    {
        id: 'event-1',
        name: 'Event Handler XSS - Inline Event Handlers',
        description: 'Unsafe inline event handler attributes with user input (OWASP Rule #3)',
        pattern: 'on(?:load|error|click|mouseover|focus|blur)\\s*=\\s*["\']\\s*\\$\\{[^}]*\\}',
        severity: 'high',
        category: 'event-handler',
        remediation: 'Avoid inline event handlers. Use addEventListener() instead.'
    },
    {
        id: 'js-url-1',
        name: 'JavaScript URL XSS - href with javascript:',
        description: 'Unsafe JavaScript URLs in href attributes (OWASP Rule #4)',
        pattern: 'href\\s*=\\s*["\']javascript:',
        severity: 'high',
        category: 'js-url',
        remediation: 'Avoid "javascript:" URLs. Validate URLs to ensure they use safe protocols.'
    },
    {
        id: 'css-1',
        name: 'CSS Injection - expression() and javascript: URLs',
        description: 'Untrusted data in CSS context with expression() or javascript: URLs (OWASP Rule #4)',
        pattern: '(?:url\\s*\\(\\s*[\'"]?javascript:|expression\\s*\\()',
        severity: 'medium',
        category: 'css',
        remediation: 'Do not include user-provided data directly in CSS.'
    },
    {
        id: 'framework-1',
        name: 'React dangerouslySetInnerHTML',
        description: 'React dangerouslySetInnerHTML prop without sanitization (OWASP Rule #1)',
        pattern: 'dangerouslySetInnerHTML\\s*=\\s*\\{\\s*\\{\\s*__html\\s*:',
        severity: 'high',
        category: 'framework',
        remediation: 'Do not use dangerouslySetInnerHTML with unsanitized user-provided content.'
    },
    {
        id: 'filter-evasion-1',
        name: 'Filter Evasion - Case Variation',
        description: 'Case variation to bypass filters (e.g., <ScRiPt>) (OWASP Testing Guide)',
        pattern: '<(?:s|S)(?:c|C)(?:r|R)(?:i|I)(?:p|P)(?:t|T)',
        severity: 'medium',
        category: 'reflected',
        remediation: 'Use case-insensitive pattern matching when validating or sanitizing input.'
    }
]; 
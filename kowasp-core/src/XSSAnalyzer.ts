import * as cheerio from 'cheerio';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { XSSFinding } from './types';

export class XSSAnalyzer {
    constructor() {}

    private isHTMLFile(content: string): boolean {
        return /^\s*<!DOCTYPE\s+html>|^\s*<html/i.test(content);
    }

    private analyzeHTML(content: string): XSSFinding[] {
        const findings: XSSFinding[] = [];
        const $ = cheerio.load(content);

        // Check for <script> tags
        $('script').each((i, elem) => {
            findings.push({
                pattern_name: 'Script Tag',
                description: 'Use of <script> tag can lead to XSS',
                severity: 'High',
                matched_text: $(elem).toString(),
                position: [0, 0],
                example: '<script>alert("XSS")</script>'
            });
        });

        // Check for dangerous event handler attributes (on*)
        $('*').each((i, elem) => {
            if ('attribs' in elem) {
                for (const [attr, value] of Object.entries(elem.attribs)) {
                    if (/^on/i.test(attr)) {
                        findings.push({
                            pattern_name: 'Event Handler',
                            description: `Use of ${attr} attribute can lead to XSS`,
                            severity: 'High',
                            matched_text: $(elem).toString(),
                            position: [0, 0],
                            example: `<img ${attr}="alert('XSS')">`
                        });
                    }
                }
            }
        });

        // Check for dangerous attribute values (javascript:, data:)
        $('*').each((i, elem) => {
            if ('attribs' in elem) {
                for (const [attr, value] of Object.entries(elem.attribs)) {
                    if (typeof value === 'string' && /^(javascript:|data:)/i.test(value.trim())) {
                        findings.push({
                            pattern_name: 'Dangerous Attribute Value',
                            description: `Attribute ${attr} with value starting with javascript: or data: can lead to XSS`,
                            severity: 'High',
                            matched_text: $(elem).toString(),
                            position: [0, 0],
                            example: `<a href="javascript:alert('XSS')">Click me</a>`
                        });
                    }
                }
            }
        });

        // Check for specific dangerous tags/attributes
        // <img src=...>
        $('img').each((i, elem) => {
            if ('attribs' in elem && elem.attribs['src'] && /^(javascript:|data:)/i.test(elem.attribs['src'].trim())) {
                findings.push({
                    pattern_name: 'img[src]',
                    description: 'img[src] with javascript: or data: can lead to XSS',
                    severity: 'High',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: `<img src="javascript:alert('XSS')">`
                });
            }
        });
        // <iframe src=...>
        $('iframe').each((i, elem) => {
            if ('attribs' in elem && elem.attribs['src'] && /^(javascript:|data:)/i.test(elem.attribs['src'].trim())) {
                findings.push({
                    pattern_name: 'iframe[src]',
                    description: 'iframe[src] with javascript: or data: can lead to XSS',
                    severity: 'High',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: `<iframe src="javascript:alert('XSS')">`
                });
            }
        });
        // <input type="image" src=...>
        $('input[type="image"]').each((i, elem) => {
            if ('attribs' in elem && elem.attribs['src'] && /^(javascript:|data:)/i.test(elem.attribs['src'].trim())) {
                findings.push({
                    pattern_name: 'input[type=image][src]',
                    description: 'input[type=image][src] with javascript: or data: can lead to XSS',
                    severity: 'High',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: `<input type="image" src="javascript:alert('XSS')">`
                });
            }
        });
        // <body background=...>
        $('body').each((i, elem) => {
            if ('attribs' in elem && elem.attribs['background'] && /^(javascript:|data:)/i.test(elem.attribs['background'].trim())) {
                findings.push({
                    pattern_name: 'body[background]',
                    description: 'body[background] with javascript: or data: can lead to XSS',
                    severity: 'High',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: `<body background="javascript:alert('XSS')">`
                });
            }
        });
        // <object data=...>
        $('object').each((i, elem) => {
            if ('attribs' in elem && elem.attribs['data'] && /^(javascript:|data:)/i.test(elem.attribs['data'].trim())) {
                findings.push({
                    pattern_name: 'object[data]',
                    description: 'object[data] with javascript: or data: can lead to XSS',
                    severity: 'High',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: `<object data="javascript:alert('XSS')">`
                });
            }
        });
        // <embed src=...>
        $('embed').each((i, elem) => {
            if ('attribs' in elem && elem.attribs['src'] && /^(javascript:|data:)/i.test(elem.attribs['src'].trim())) {
                findings.push({
                    pattern_name: 'embed[src]',
                    description: 'embed[src] with javascript: or data: can lead to XSS',
                    severity: 'High',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: `<embed src="javascript:alert('XSS')">`
                });
            }
        });
        // <form action=...>
        $('form').each((i, elem) => {
            if ('attribs' in elem && elem.attribs['action'] && /^(javascript:|data:)/i.test(elem.attribs['action'].trim())) {
                findings.push({
                    pattern_name: 'form[action]',
                    description: 'form[action] with javascript: or data: can lead to XSS',
                    severity: 'High',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: `<form action="javascript:alert('XSS')">`
                });
            }
        });

        // Check for dangerous URLs (javascript:, data:) in <a href> and <img src>
        $('a[href^="javascript:"], a[href^="data:"]').each((i, elem) => {
            findings.push({
                pattern_name: 'Dangerous URL',
                description: 'Use of javascript: or data: URL can lead to XSS',
                severity: 'High',
                matched_text: $(elem).toString(),
                position: [0, 0],
                example: `<a href="javascript:alert('XSS')">Click me</a>`
            });
        });
        $('img[src^="javascript:"], img[src^="data:"]').each((i, elem) => {
            findings.push({
                pattern_name: 'Dangerous URL',
                description: 'Use of javascript: or data: URL can lead to XSS',
                severity: 'High',
                matched_text: $(elem).toString(),
                position: [0, 0],
                example: `<img src="javascript:alert('XSS')">`
            });
        });

        // <meta http-equiv="refresh" content="0;url=javascript:...">
        $('meta[http-equiv]').each((i, elem) => {
            if ('attribs' in elem) {
                const httpEquiv = elem.attribs['http-equiv']?.toLowerCase();
                const content = elem.attribs['content'] || '';
                if (httpEquiv === 'refresh' && /url\s*=\s*javascript:/i.test(content)) {
                    findings.push({
                        pattern_name: 'meta[http-equiv=refresh][content]',
                        description: 'meta refresh with javascript: URL can lead to XSS',
                        severity: 'High',
                        matched_text: $(elem).toString(),
                        position: [0, 0],
                        example: '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">' 
                    });
                }
            }
        });

        // <svg> tags with event handlers or <script>
        $('svg').each((i, elem) => {
            if ('attribs' in elem) {
                for (const [attr, value] of Object.entries(elem.attribs)) {
                    if (/^on/i.test(attr)) {
                        findings.push({
                            pattern_name: 'svg event handler',
                            description: 'SVG tag with event handler can lead to XSS',
                            severity: 'High',
                            matched_text: $(elem).toString(),
                            position: [0, 0],
                            example: '<svg onload="alert(1)">' 
                        });
                    }
                }
            }
            // Check for <script> inside <svg>
            const svgHtml = $(elem).html() || '';
            if (/script/i.test(svgHtml)) {
                findings.push({
                    pattern_name: 'svg<script>',
                    description: 'SVG tag containing <script> can lead to XSS',
                    severity: 'High',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: '<svg><script>alert(1)</script></svg>'
                });
            }
        });

        // Suspicious attribute values (encoded JS, expression, url(javascript:))
        $('*').each((i, elem) => {
            if ('attribs' in elem) {
                for (const [attr, value] of Object.entries(elem.attribs)) {
                    if (typeof value === 'string') {
                        if (/&#x/i.test(value) || /&#\d+/.test(value)) {
                            findings.push({
                                pattern_name: 'Encoded JS in Attribute',
                                description: 'Attribute value contains encoded JS (&#x or &#NNN)',
                                severity: 'Medium',
                                matched_text: $(elem).toString(),
                                position: [0, 0],
                                example: '<img src="&#x6a;&#x61;...">'
                            });
                        }
                        if (/expression\s*\(/i.test(value)) {
                            findings.push({
                                pattern_name: 'CSS Expression',
                                description: 'CSS expression() in attribute value can lead to XSS',
                                severity: 'High',
                                matched_text: $(elem).toString(),
                                position: [0, 0],
                                example: '<div style="width: expression(alert(1))">'
                            });
                        }
                        if (/url\s*\(\s*javascript:/i.test(value)) {
                            findings.push({
                                pattern_name: 'CSS url(javascript:)',
                                description: 'CSS url(javascript:...) in attribute value can lead to XSS',
                                severity: 'High',
                                matched_text: $(elem).toString(),
                                position: [0, 0],
                                example: '<div style="background:url(javascript:alert(1))">'
                            });
                        }
                    }
                }
            }
        });

        // Suspicious tag names
        const suspiciousTags = ['object', 'embed', 'applet', 'base', 'form', 'link', 'isindex', 'plaintext', 'xss'];
        suspiciousTags.forEach(tag => {
            $(tag).each((i, elem) => {
                findings.push({
                    pattern_name: `Suspicious Tag: <${tag}>`,
                    description: `<${tag}> tag can be used for XSS`,
                    severity: 'Medium',
                    matched_text: $(elem).toString(),
                    position: [0, 0],
                    example: `<${tag}> ... </${tag}>`
                });
            });
        });

        // Malformed tags: <scr<script>ipt>, <img src=...> with missing quotes
        // (Simple regex scan on raw content)
        const malformedPatterns = [
            /<scr\s*<script>ipt>/i,
            /<img\s+src=\s*javascript:[^\s>]+/i
        ];
        malformedPatterns.forEach((pat) => {
            if (pat.test(content)) {
                findings.push({
                    pattern_name: 'Malformed Tag',
                    description: 'Malformed or obfuscated tag pattern that may lead to XSS',
                    severity: 'Medium',
                    matched_text: content.match(pat)?.[0] || '',
                    position: [0, 0],
                    example: '<scr<script>ipt>'
                });
            }
        });

        return findings;
    }

    private analyzeJavaScript(content: string): XSSFinding[] {
        const findings: XSSFinding[] = [];
        const ast = parse(content, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });

        traverse(ast, {
            CallExpression(path) {
                const node = path.node;
                const callee = node.callee;

                // Dangerous function calls
                if (
                    callee.type === 'Identifier' &&
                    ['eval', 'Function', 'setTimeout', 'setInterval'].includes(callee.name)
                ) {
                    findings.push({
                        pattern_name: callee.name,
                        description: `Use of ${callee.name}() can lead to XSS`,
                        severity: 'High',
                        matched_text: content.slice(node.start || 0, node.end || 0),
                        position: [node.loc?.start.line || 0, node.loc?.end.line || 0],
                        example: `${callee.name}(userInput);`
                    });
                }

                // document.write
                if (
                    callee.type === 'MemberExpression' &&
                    callee.object.type === 'Identifier' &&
                    callee.object.name === 'document' &&
                    callee.property.type === 'Identifier' &&
                    callee.property.name === 'write'
                ) {
                    findings.push({
                        pattern_name: 'document.write',
                        description: 'Use of document.write() can lead to XSS',
                        severity: 'High',
                        matched_text: content.slice(node.start || 0, node.end || 0),
                        position: [node.loc?.start.line || 0, node.loc?.end.line || 0],
                        example: 'document.write(userInput);'
                    });
                }
            },

            AssignmentExpression(path) {
                const node = path.node;
                const left = node.left;

                if (
                    left.type === 'MemberExpression' &&
                    left.property.type === 'Identifier'
                ) {
                    const obj = left.object;
                    const prop = left.property;
                    let objName = '';

                    if (obj.type === 'Identifier') {
                        objName = obj.name;
                    }

                    if (
                        (prop.name === 'innerHTML' || prop.name === 'outerHTML') ||
                        (obj.type === 'Identifier' && obj.name === 'location' && prop.name === 'href') ||
                        (obj.type === 'Identifier' && obj.name === 'document' && prop.name === 'cookie')
                    ) {
                        findings.push({
                            pattern_name: `${objName}.${prop.name}`,
                            description: `Assignment to ${objName}.${prop.name} can lead to XSS`,
                            severity: 'High',
                            matched_text: content.slice(node.start || 0, node.end || 0),
                            position: [node.loc?.start.line || 0, node.loc?.end.line || 0],
                            example: `${objName}.${prop.name} = userInput;`
                        });
                    }
                }
            },

            JSXAttribute(path) {
                const node = path.node;
                if (
                    node.name.type === 'JSXIdentifier' &&
                    node.name.name === 'dangerouslySetInnerHTML'
                ) {
                    findings.push({
                        pattern_name: 'dangerouslySetInnerHTML',
                        description: 'Usage of dangerouslySetInnerHTML can lead to XSS',
                        severity: 'High',
                        matched_text: 'dangerouslySetInnerHTML',
                        position: [node.loc?.start.line || 0, node.loc?.end.line || 0],
                        example: '<div dangerouslySetInnerHTML={{ __html: userInput }} />'
                    });
                }
            }
        });

        return findings;
    }

    public analyze(content: string): XSSFinding[] {
        if (this.isHTMLFile(content)) {
            return this.analyzeHTML(content);
        } else {
            return this.analyzeJavaScript(content);
        }
    }

    public displayResults(findings: XSSFinding[]): void {
        console.log('\nXSS Analysis Results:');
        console.log('='.repeat(80));

        for (const finding of findings) {
            console.log(`\nPattern: ${finding.pattern_name}\nSeverity: ${finding.severity}\nMatched Text: ${finding.matched_text}\nDescription: ${finding.description}\nExample: ${finding.example}\n${'-'.repeat(80)}`);
        }
    }
} 
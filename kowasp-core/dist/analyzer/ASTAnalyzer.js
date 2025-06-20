"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTAnalyzer = void 0;
const esprima = __importStar(require("esprima"));
const estraverse = __importStar(require("estraverse"));
const xss_patterns_1 = require("../patterns/xss-patterns");
class ASTAnalyzer {
    constructor(filePath) {
        this.filePath = filePath;
        this.vulnerabilities = [];
    }
    analyze(code) {
        try {
            const ast = esprima.parseScript(code, { loc: true });
            this.traverseAST(ast);
            return this.vulnerabilities;
        }
        catch (error) {
            console.error(`Error analyzing file ${this.filePath}:`, error);
            return [];
        }
    }
    traverseAST(ast) {
        estraverse.traverse(ast, {
            enter: (node) => {
                this.checkNode(node);
            }
        });
    }
    checkNode(node) {
        // Check for response sending patterns
        if (this.isResponseNode(node)) {
            this.checkResponseVulnerabilities(node);
        }
        // Check for DOM manipulation
        if (this.isDOMNode(node)) {
            this.checkDOMVulnerabilities(node);
        }
        // Check for event handlers
        if (this.isEventHandlerNode(node)) {
            this.checkEventVulnerabilities(node);
        }
        // Check for JavaScript URLs
        if (this.isJSURLNode(node)) {
            this.checkJSURLVulnerabilities(node);
        }
        if (this.isFileUploadNode(node)) {
            this.checkFileUploadVulnerabilities(node);
        }
        if (this.isNoSQLInjectionNode(node)) {
            this.checkNoSQLInjectionVulnerabilities(node);
        }
    }
    isResponseNode(node) {
        return node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee?.object?.name === 'res' &&
            ['send', 'render', 'json'].includes(node.callee?.property?.name);
    }
    isDOMNode(node) {
        return node.type === 'MemberExpression' &&
            node.object?.type === 'CallExpression' &&
            node.object?.callee?.object?.name === 'document' &&
            ['innerHTML', 'outerHTML'].includes(node.property?.name);
    }
    isEventHandlerNode(node) {
        return node.type === 'Property' &&
            node.key?.name?.startsWith('on') &&
            node.value?.type === 'TemplateLiteral';
    }
    isJSURLNode(node) {
        return node.type === 'Property' &&
            node.key?.name === 'href' &&
            node.value?.type === 'Literal' &&
            typeof node.value?.value === 'string' &&
            node.value?.value.startsWith('javascript:');
    }
    isFileUploadNode(node) {
        // Check for import declarations
        if (node.type === 'ImportDeclaration') {
            const source = node.source?.value;
            return source === 'multer' || source === 'express-fileupload';
        }
        // Check for require calls
        if (node.type === 'CallExpression' &&
            node.callee?.name === 'require' &&
            node.arguments?.[0]?.type === 'Literal') {
            const source = node.arguments[0].value;
            return source === 'multer' || source === 'express-fileupload';
        }
        return false;
    }
    isNoSQLInjectionNode(node) {
        if (node.type !== 'CallExpression') {
            return false;
        }
        const callee = node.callee;
        if (callee?.type !== 'MemberExpression') {
            return false;
        }
        const propertyName = callee.property?.name;
        const isDbMethod = ['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(propertyName);
        if (!isDbMethod) {
            return false;
        }
        // A simple heuristic: check if user input is passed directly.
        const argument = node.arguments?.[0];
        if (argument) {
            const nodeCode = this.getNodeCode(argument);
            return nodeCode.includes('req.query') || nodeCode.includes('req.body');
        }
        return false;
    }
    checkResponseVulnerabilities(node) {
        const pattern = xss_patterns_1.xssPatterns.find(p => p.id === 'reflected-1');
        if (pattern && this.matchesPattern(node, pattern)) {
            this.addVulnerability(node, pattern);
        }
    }
    checkDOMVulnerabilities(node) {
        const pattern = xss_patterns_1.xssPatterns.find(p => p.id === 'dom-1');
        if (pattern && this.matchesPattern(node, pattern)) {
            this.addVulnerability(node, pattern);
        }
    }
    checkEventVulnerabilities(node) {
        const pattern = xss_patterns_1.xssPatterns.find(p => p.id === 'event-1');
        if (pattern && this.matchesPattern(node, pattern)) {
            this.addVulnerability(node, pattern);
        }
    }
    checkJSURLVulnerabilities(node) {
        const pattern = xss_patterns_1.xssPatterns.find(p => p.id === 'js-url-1');
        if (pattern && this.matchesPattern(node, pattern)) {
            this.addVulnerability(node, pattern);
        }
    }
    checkFileUploadVulnerabilities(node) {
        const pattern = xss_patterns_1.xssPatterns.find(p => p.id === 'file-upload-1');
        if (pattern) {
            this.addVulnerability(node, pattern);
        }
    }
    checkNoSQLInjectionVulnerabilities(node) {
        const pattern = xss_patterns_1.xssPatterns.find(p => p.id === 'nosql-injection-1');
        if (pattern) {
            this.addVulnerability(node, pattern);
        }
    }
    matchesPattern(node, pattern) {
        const nodeCode = this.getNodeCode(node);
        return new RegExp(pattern.pattern).test(nodeCode);
    }
    getNodeCode(node) {
        // This is a simplified version. In a real implementation,
        // you would need to properly reconstruct the code from the AST
        return JSON.stringify(node);
    }
    addVulnerability(node, pattern) {
        if (!node.loc)
            return;
        const vulnerability = {
            type: pattern.category,
            severity: pattern.severity,
            location: {
                file: this.filePath,
                line: node.loc.start.line,
                column: node.loc.start.column
            },
            description: pattern.description,
            code: this.getNodeCode(node),
            remediation: pattern.remediation,
            confidence: 0.8 // This would be calculated based on context in a real implementation
        };
        this.vulnerabilities.push(vulnerability);
    }
}
exports.ASTAnalyzer = ASTAnalyzer;

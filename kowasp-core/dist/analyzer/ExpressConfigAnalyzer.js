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
exports.ExpressConfigAnalyzer = void 0;
const esprima = __importStar(require("esprima"));
const estraverse = __importStar(require("estraverse"));
class ExpressConfigAnalyzer {
    constructor(filePath) {
        this.filePath = filePath;
        this.config = {
            helmet: false,
            contentSecurityPolicy: false,
            xssFilter: false,
            noSniff: false,
            frameguard: false,
            hsts: false,
            viewEngine: undefined,
            ejsEscapingDisabled: undefined
        };
        this.missingHeaders = [];
        this.recommendations = [];
    }
    analyze(code) {
        try {
            const ast = esprima.parseScript(code, { loc: true });
            this.traverseAST(ast);
            this.generateRecommendations();
            return {
                vulnerabilities: [], // This will be populated by the main analyzer
                expressConfig: this.config,
                missingSecurityHeaders: this.missingHeaders,
                recommendations: this.recommendations
            };
        }
        catch (error) {
            console.error(`Error analyzing Express config in ${this.filePath}:`, error);
            return {
                vulnerabilities: [],
                expressConfig: this.config,
                missingSecurityHeaders: [],
                recommendations: ['Error analyzing Express configuration']
            };
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
        // Check for helmet usage
        if (this.isHelmetUsage(node)) {
            this.config.helmet = true;
            this.checkHelmetConfig(node);
        }
        // Check for security headers
        if (this.isSecurityHeader(node)) {
            this.checkSecurityHeaders(node);
        }
        if (this.isViewEngineSet(node)) {
            this.checkViewEngine(node);
        }
        if (this.isEjsEscapingDisabled(node)) {
            this.config.ejsEscapingDisabled = true;
        }
    }
    isHelmetUsage(node) {
        return node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee?.object?.name === 'app' &&
            node.callee?.property?.name === 'use' &&
            node.arguments?.[0]?.type === 'CallExpression' &&
            node.arguments?.[0]?.callee?.name === 'helmet';
    }
    isSecurityHeader(node) {
        return node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee?.object?.name === 'app' &&
            node.callee?.property?.name === 'use' &&
            node.arguments?.[0]?.type === 'CallExpression' &&
            ['helmet', 'helmet.contentSecurityPolicy', 'helmet.xssFilter', 'helmet.noSniff', 'helmet.frameguard', 'helmet.hsts']
                .includes(node.arguments?.[0]?.callee?.name);
    }
    checkHelmetConfig(node) {
        const helmetConfig = node.arguments?.[0]?.arguments?.[0];
        if (helmetConfig?.type === 'ObjectExpression') {
            this.checkHelmetOptions(helmetConfig);
        }
    }
    checkHelmetOptions(config) {
        config.properties?.forEach((prop) => {
            switch (prop.key?.name) {
                case 'contentSecurityPolicy':
                    this.config.contentSecurityPolicy = true;
                    break;
                case 'xssFilter':
                    this.config.xssFilter = true;
                    break;
                case 'noSniff':
                    this.config.noSniff = true;
                    break;
                case 'frameguard':
                    this.config.frameguard = true;
                    break;
                case 'hsts':
                    this.config.hsts = true;
                    break;
            }
        });
    }
    checkSecurityHeaders(node) {
        const headerName = node.arguments?.[0]?.callee?.name;
        switch (headerName) {
            case 'helmet.contentSecurityPolicy':
                this.config.contentSecurityPolicy = true;
                break;
            case 'helmet.xssFilter':
                this.config.xssFilter = true;
                break;
            case 'helmet.noSniff':
                this.config.noSniff = true;
                break;
            case 'helmet.frameguard':
                this.config.frameguard = true;
                break;
            case 'helmet.hsts':
                this.config.hsts = true;
                break;
        }
    }
    isViewEngineSet(node) {
        return node.type === 'CallExpression' &&
            node.callee?.type === 'MemberExpression' &&
            node.callee?.object?.name === 'app' &&
            node.callee?.property?.name === 'set' &&
            node.arguments?.[0]?.type === 'Literal' &&
            node.arguments?.[0]?.value === 'view engine' &&
            node.arguments?.[1]?.type === 'Literal';
    }
    checkViewEngine(node) {
        if (node.arguments?.[1]?.type === 'Literal') {
            this.config.viewEngine = node.arguments[1].value;
        }
    }
    isEjsEscapingDisabled(node) {
        return node.type === 'AssignmentExpression' &&
            node.left?.type === 'MemberExpression' &&
            node.left?.object?.type === 'MemberExpression' &&
            node.left?.object?.object?.name === 'app' &&
            node.left?.object?.property?.name === 'locals' &&
            node.left?.property?.name === 'escape' &&
            node.right?.type === 'Literal' &&
            node.right?.value === false;
    }
    generateRecommendations() {
        if (!this.config.helmet) {
            this.recommendations.push('Install and configure helmet middleware for security headers');
        }
        if (!this.config.contentSecurityPolicy) {
            this.missingHeaders.push('Content-Security-Policy');
            this.recommendations.push('Configure Content Security Policy using helmet.contentSecurityPolicy()');
        }
        if (!this.config.xssFilter) {
            this.missingHeaders.push('X-XSS-Protection');
            this.recommendations.push('Enable XSS protection using helmet.xssFilter()');
        }
        if (!this.config.noSniff) {
            this.missingHeaders.push('X-Content-Type-Options');
            this.recommendations.push('Enable X-Content-Type-Options using helmet.noSniff()');
        }
        if (!this.config.frameguard) {
            this.missingHeaders.push('X-Frame-Options');
            this.recommendations.push('Configure frame protection using helmet.frameguard()');
        }
        if (!this.config.hsts) {
            this.missingHeaders.push('Strict-Transport-Security');
            this.recommendations.push('Enable HSTS using helmet.hsts()');
        }
        if (this.config.viewEngine === 'ejs' && this.config.ejsEscapingDisabled) {
            this.recommendations.push('EJS auto-escaping is disabled application-wide. This is a high-risk security vulnerability. Enable it by removing `app.locals.escape = false`.');
        }
        else if (this.config.viewEngine) {
            this.recommendations.push(`Template engine '${this.config.viewEngine}' is in use. Ensure that output is properly escaped to prevent XSS. For EJS, do not use <%- ... %>. For Pug, do not use != or #{} syntax with untrusted data.`);
        }
    }
}
exports.ExpressConfigAnalyzer = ExpressConfigAnalyzer;

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
const ExpressXSSAnalyzer_1 = require("../src/ExpressXSSAnalyzer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Sample ExpressJS application code with security issues
const sampleExpressCode = `
import express from 'express';
const app = express();

// Missing security middleware
app.use(express.json());

// Route with potential XSS vulnerability
app.get('/search', (req, res) => {
    const query = req.query.q;
    res.send('<h1>Search Results for: ' + query + '</h1>');
});

// Route with cookie without security flags
app.post('/login', (req, res) => {
    res.cookie('sessionId', 'some-value');
    res.send('Logged in');
});

// Route with direct user input in response
app.post('/comment', (req, res) => {
    const comment = req.body.comment;
    res.json({ message: comment });
});

app.listen(3000);
`;
// Create analyzer instance
const analyzer = new ExpressXSSAnalyzer_1.ExpressXSSAnalyzer();
// Analyze the sample code
const findings = analyzer.analyzeExpressApp(sampleExpressCode);
// Display results
analyzer.displayResults(findings);
// Function to analyze a real ExpressJS application
async function analyzeExpressApp(appPath) {
    try {
        // Read all TypeScript/JavaScript files in the application
        const files = await getAllFiles(appPath, ['.ts', '.js']);
        for (const file of files) {
            console.log(`\nAnalyzing file: ${file}`);
            const content = fs.readFileSync(file, 'utf-8');
            const findings = analyzer.analyzeExpressApp(content);
            analyzer.displayResults(findings);
        }
    }
    catch (error) {
        console.error('Error analyzing application:', error);
    }
}
// Helper function to get all files with specific extensions
async function getAllFiles(dirPath, extensions) {
    const files = [];
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...await getAllFiles(fullPath, extensions));
        }
        else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
        }
    }
    return files;
}
// Example usage with a real ExpressJS application
// Uncomment and modify the path to analyze your ExpressJS application
// analyzeExpressApp('/path/to/your/express/app'); 

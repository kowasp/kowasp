import { ExpressXSSAnalyzer } from '../src/ExpressXSSAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

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
const analyzer = new ExpressXSSAnalyzer();

// Analyze the sample code
const findings = analyzer.analyzeExpressApp(sampleExpressCode);

// Display results
analyzer.displayResults(findings);

// Function to analyze a real ExpressJS application
async function analyzeExpressApp(appPath: string) {
    try {
        // Read all TypeScript/JavaScript files in the application
        const files = await getAllFiles(appPath, ['.ts', '.js']);
        
        for (const file of files) {
            console.log(`\nAnalyzing file: ${file}`);
            const content = fs.readFileSync(file, 'utf-8');
            const findings = analyzer.analyzeExpressApp(content);
            analyzer.displayResults(findings);
        }
    } catch (error) {
        console.error('Error analyzing application:', error);
    }
}

// Helper function to get all files with specific extensions
async function getAllFiles(dirPath: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...await getAllFiles(fullPath, extensions));
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Example usage with a real ExpressJS application
// Uncomment and modify the path to analyze your ExpressJS application
// analyzeExpressApp('/path/to/your/express/app'); 
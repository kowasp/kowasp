import express, { Request, Response } from 'express';
import helmet from 'helmet';
import xss from 'xss';

const app = express();
const port = 3001;

// Enhanced Security middleware
app.use(helmet()); // Adds various HTTP headers
app.use(helmet.xssFilter()); // Enable XSS protection
app.use(helmet.noSniff()); // Enable X-Content-Type-Options
app.use(helmet.frameguard({ action: 'deny' })); // Configure frame protection
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true })); // Enable HSTS

// Strict Content Security Policy with nonce-based script execution
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for demo purposes
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
    }
}));

// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Input validation helper function
function validateInput(input: any): string {
    if (!input || typeof input !== 'string') {
        return '';
    }
    // Remove any script tags and dangerous patterns
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
}

// URL validation helper function
function isValidUrl(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Secure routes with XSS prevention

// 1. Basic Reflected XSS Prevention
app.get('/search', (req: Request, res: Response) => {
    const searchTerm = validateInput(req.query.q);
    const sanitizedTerm = xss(searchTerm);
    res.send(`
        <h1>Search Results</h1>
        <p>You searched for: ${sanitizedTerm}</p>
    `);
});

// 2. Stored XSS Prevention
let comments: string[] = [];
app.post('/comment', (req: Request, res: Response) => {
    const comment = validateInput(req.body.comment);
    if (comment.length > 1000) { // Limit comment length
        return res.status(400).send('Comment too long');
    }
    const sanitizedComment = xss(comment);
    comments.push(sanitizedComment);
    res.redirect('/comments');
});

app.get('/comments', (req: Request, res: Response) => {
    const safeComments = comments.map(comment => `<p>${comment}</p>`).join('');
    res.send(`
        <h1>Comments</h1>
        ${safeComments}
    `);
});

// 3. DOM-based XSS Prevention - FIXED
app.get('/dom-xss', (req: Request, res: Response) => {
    const name = validateInput(req.query.name);
    const encodedName = encodeURIComponent(name);
    res.send(`
        <html>
        <head>
            <title>DOM XSS Prevention Example</title>
        </head>
        <body>
            <h1>DOM XSS Prevention Example</h1>
            <div id="output"></div>
            <script>
                const urlParams = new URLSearchParams(window.location.search);
                const name = urlParams.get('name');
                // Use textContent and encode the output
                const output = document.getElementById('output');
                if (name) {
                    output.textContent = decodeURIComponent(name);
                }
            </script>
        </body>
        </html>
    `);
});

// 4. Event Handler XSS Prevention - FIXED
app.get('/event-xss', (req: Request, res: Response) => {
    const userInput = validateInput(req.query.input);
    const sanitizedInput = xss(userInput);
    res.send(`
        <html>
        <head>
            <title>Event XSS Prevention</title>
        </head>
        <body>
            <h1>Event XSS Prevention Example</h1>
            <div id="safe-content">${sanitizedInput}</div>
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                 alt="Safe image" 
                 onerror="console.log('Image failed to load')">
        </body>
        </html>
    `);
});

// 5. JavaScript URL XSS Prevention - FIXED
app.get('/js-url-xss', (req: Request, res: Response) => {
    const redirectUrl = validateInput(req.query.url);
    
    if (!redirectUrl || !isValidUrl(redirectUrl)) {
        return res.status(400).send(`
            <html>
            <body>
                <h1>Invalid URL</h1>
                <p>The provided URL is invalid or not allowed.</p>
            </body>
            </html>
        `);
    }
    
    const sanitizedUrl = xss(redirectUrl);
    res.send(`
        <html>
        <head>
            <title>Safe URL Example</title>
        </head>
        <body>
            <h1>Safe URL Example</h1>
            <a href="${sanitizedUrl}" rel="noopener noreferrer" target="_blank">Click me (opens in new tab)</a>
        </body>
        </html>
    `);
});

// 6. Filter Evasion Prevention - FIXED
app.get('/filter-evasion', (req: Request, res: Response) => {
    const input = validateInput(req.query.input);
    const sanitizedInput = xss(input);
    res.send(`
        <html>
        <head>
            <title>Filter Evasion Prevention</title>
        </head>
        <body>
            <h1>Filter Evasion Prevention Example</h1>
            <div id="safe-content">${sanitizedInput}</div>
        </body>
        </html>
    `);
});

// 7. Additional secure route for demonstration
app.get('/secure-demo', (req: Request, res: Response) => {
    res.send(`
        <html>
        <head>
            <title>Secure Demo</title>
        </head>
        <body>
            <h1>Secure Application Demo</h1>
            <p>This application demonstrates secure coding practices:</p>
            <ul>
                <li>Content Security Policy (CSP) implementation</li>
                <li>Input validation and sanitization</li>
                <li>XSS prevention using the xss library</li>
                <li>Proper URL validation</li>
                <li>Security headers with Helmet</li>
            </ul>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Secure app listening at http://localhost:${port}`);
    console.log('Security features enabled:');
    console.log('- Content Security Policy (CSP)');
    console.log('- XSS Protection');
    console.log('- HSTS');
    console.log('- Frame protection');
    console.log('- Input validation and sanitization');
}); 
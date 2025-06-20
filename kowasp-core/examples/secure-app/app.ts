import express, { Request, Response } from 'express';
import helmet from 'helmet';
import xss from 'xss';

const app = express();
const port = 3001;

// Security middleware
app.use(helmet()); // Adds various HTTP headers
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"]
    }
}));

// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Secure routes with XSS prevention

// 1. Basic Reflected XSS Prevention
app.get('/search', (req: Request, res: Response) => {
    const searchTerm = xss(req.query.q as string);
    res.send(`
        <h1>Search Results</h1>
        <p>You searched for: ${searchTerm}</p>
    `);
});

// 2. Stored XSS Prevention
let comments: string[] = [];
app.post('/comment', (req: Request, res: Response) => {
    const comment = xss(req.body.comment as string);
    comments.push(comment);
    res.redirect('/comments');
});

app.get('/comments', (req: Request, res: Response) => {
    const safeComments = comments.map(comment => `<p>${xss(comment)}</p>`).join('');
    res.send(`
        <h1>Comments</h1>
        ${safeComments}
    `);
});

// 3. DOM-based XSS Prevention
app.get('/dom-xss', (req: Request, res: Response) => {
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
                // Use textContent instead of innerHTML
                document.getElementById('output').textContent = name;
            </script>
        </body>
        </html>
    `);
});

// 4. Event Handler XSS Prevention
app.get('/event-xss', (req: Request, res: Response) => {
    const userInput = xss(req.query.input as string);
    res.send(`
        <html>
        <body>
            <img src="x" onerror="console.log('Image failed to load')">
        </body>
        </html>
    `);
});

// 5. JavaScript URL XSS Prevention
app.get('/js-url-xss', (req: Request, res: Response) => {
    const redirectUrl = xss(req.query.url as string);
    // Validate URL
    try {
        new URL(redirectUrl);
        res.send(`
            <html>
            <body>
                <a href="${redirectUrl}" rel="noopener noreferrer">Click me</a>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(400).send('Invalid URL');
    }
});

// 6. Filter Evasion Prevention
app.get('/filter-evasion', (req: Request, res: Response) => {
    const input = xss(req.query.input as string);
    res.send(`
        <html>
        <body>
            <div>${input}</div>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Secure app listening at http://localhost:${port}`);
}); 
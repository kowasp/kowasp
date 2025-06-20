import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Vulnerable routes demonstrating different XSS scenarios

// 1. Basic Reflected XSS
app.get('/search', (req: Request, res: Response) => {
    const searchTerm = req.query.q as string;
    res.send(`
        <h1>Search Results</h1>
        <p>You searched for: ${searchTerm}</p>
    `);
});

// 2. Stored XSS (simulated with in-memory storage)
let comments: string[] = [];
app.post('/comment', (req: Request, res: Response) => {
    const comment = req.body.comment as string;
    comments.push(comment);
    res.redirect('/comments');
});

app.get('/comments', (req: Request, res: Response) => {
    res.send(`
        <h1>Comments</h1>
        ${comments.map(comment => `<p>${comment}</p>`).join('')}
    `);
});

// 3. DOM-based XSS
app.get('/dom-xss', (req: Request, res: Response) => {
    res.send(`
        <html>
        <head>
            <title>DOM XSS Example</title>
        </head>
        <body>
            <h1>DOM XSS Example</h1>
            <div id="output"></div>
            <script>
                const urlParams = new URLSearchParams(window.location.search);
                const name = urlParams.get('name');
                document.getElementById('output').innerHTML = name;
            </script>
        </body>
        </html>
    `);
});

// 4. Event Handler XSS
app.get('/event-xss', (req: Request, res: Response) => {
    const userInput = req.query.input as string;
    res.send(`
        <html>
        <body>
            <img src="x" onerror="${userInput}">
        </body>
        </html>
    `);
});

// 5. JavaScript URL XSS
app.get('/js-url-xss', (req: Request, res: Response) => {
    const redirectUrl = req.query.url as string;
    res.send(`
        <html>
        <body>
            <a href="${redirectUrl}">Click me</a>
        </body>
        </html>
    `);
});

// 6. Filter Evasion Examples
app.get('/filter-evasion', (req: Request, res: Response) => {
    const input = req.query.input as string;
    res.send(`
        <html>
        <body>
            <div>${input}</div>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Vulnerable app listening at http://localhost:${port}`);
}); 
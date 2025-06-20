import express from 'express';
const app = express();

// Insecure: Disabling EJS escaping
app.locals.escape = false;

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index', { data: req.query.userInput });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

export {}; 
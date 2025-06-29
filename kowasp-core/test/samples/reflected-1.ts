export const vulnerable = `
app.get('/', (req, res) => {
  res.send(\`<h1>Welcome \${req.query.name}</h1>\`);
});
`;

export const secure = `
const xss = require('xss');
app.get('/', (req, res) => {
  const sanitizedName = xss(req.query.name);
  res.send(\`<h1>Welcome \${sanitizedName}</h1>\`);
});
`; 
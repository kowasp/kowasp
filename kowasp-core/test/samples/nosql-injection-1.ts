export const vulnerable = `
app.post('/login', (req, res) => {
  db.collection('users').findOne({ user: req.body.user, pass: req.body.pass }, (err, user) => {
    // ...
  });
});
`;

export const secure = `
const mongoSanitize = require('mongo-sanitize');

app.post('/login', (req, res) => {
  const cleanUser = mongoSanitize(req.body.user);
  const cleanPass = mongoSanitize(req.body.pass);
  db.collection('users').findOne({ user: cleanUser, pass: cleanPass }, (err, user) => {
    // ...
  });
});
`; 
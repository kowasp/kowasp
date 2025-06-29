export const vulnerable = `
const comment = getUserInput();
db.collection('comments').insert({ text: \`\${comment}\` });
`;

export const secure = `
const xss = require('xss');
const comment = getUserInput();
const sanitizedComment = xss(comment);
db.collection('comments').insert({ text: sanitizedComment });
`; 
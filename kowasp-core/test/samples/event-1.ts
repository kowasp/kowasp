export const vulnerable = `
const userInput = '"><script>alert("xss")</script>';
const html = \`<div onclick="\${userInput}">Click me</div>\`;
`;

export const secure = `
const userInput = 'someUserData';
const div = document.createElement('div');
div.textContent = 'Click me';
div.addEventListener('click', () => { 
    // handle click safely 
});
`; 
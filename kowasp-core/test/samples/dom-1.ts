export const vulnerable = `
const element = document.getElementById('container');
element.innerHTML = userInput;
`;

export const secure = `
const element = document.getElementById('container');
element.textContent = userInput;
`; 
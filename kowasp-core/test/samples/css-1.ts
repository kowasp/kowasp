export const vulnerable = `
const element = document.querySelector('.some-div');
element.style.backgroundImage = 'url(javascript:alert("xss"))';
`;

export const secure = `
const element = document.querySelector('.some-div');
const imageUrl = "https://example.com/image.png";
// Validate URL before using it
if (imageUrl.startsWith("https://")) {
    element.style.backgroundImage = \`url(\${imageUrl})\`;
}
`; 
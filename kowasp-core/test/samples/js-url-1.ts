export const vulnerable = `
const link = document.createElement('a');
link.href = 'javascript:alert(1)';
`;

export const secure = `
const link = document.createElement('a');
const url = "https://example.com";
if (url.startsWith("http:") || url.startsWith("https:")) {
    link.href = url;
}
`; 
export const vulnerable = `
const html = '<ScRiPt>alert(1)</sCrIpT>';
`;

export const secure = `
// Secure on server side by using case-insensitive filters
const html = '&lt;ScRiPt&gt;alert(1)&lt;/sCrIpT&gt;';
`; 
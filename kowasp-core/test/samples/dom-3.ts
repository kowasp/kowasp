export const vulnerable = `
const unsafeData = document.location.hash;
document.body.innerHTML = unsafeData;
`;

export const secure = `
const unsafeData = document.location.hash;
document.body.textContent = unsafeData;
`; 
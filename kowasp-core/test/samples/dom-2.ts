export const vulnerable = `
const userInput = "alert('xss')";
setTimeout(userInput, 100);
eval(userInput);
`;

export const secure = `
const userInput = "someAction";
setTimeout(() => {
    if(userInput === "someAction") {
        // do something safe
    }
}, 100);
// eval is always unsafe, avoid it.
`; 
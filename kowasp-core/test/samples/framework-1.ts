export const vulnerable = `
function UnsafeComponent({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
`;

export const secure = `
import DOMPurify from 'dompurify';

function SafeComponent({ content }) {
  const sanitizedContent = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
`; 
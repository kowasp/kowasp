export const vulnerable = `
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
`;

export const secure = `
const multer = require('multer');
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  },
});
`; 
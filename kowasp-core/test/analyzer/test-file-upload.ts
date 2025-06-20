import express from 'express';
import multer from 'multer';
const app = express();

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('myFile'), (req, res) => {
    res.send('File uploaded!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

export {}; 
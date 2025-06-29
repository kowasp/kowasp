const fetch = require('node-fetch');

async function testScanCode() {
  const testCode = `
const express = require('express');
const app = express();

app.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    res.send('<h1>Search Results</h1><p>You searched for: ' + searchTerm + '</p>');
});

app.post('/comment', (req, res) => {
    const comment = req.body.comment;
    // Store comment without sanitization
    comments.push(comment);
    res.redirect('/comments');
});

app.listen(3000);
`;

  try {
    const response = await fetch('http://localhost:3000/scans/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You might need a valid token
      },
      body: JSON.stringify({ code: testCode })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Scan Code Result:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testScanCode(); 
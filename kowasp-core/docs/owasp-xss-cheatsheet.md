# OWASP XSS Prevention Cheatsheet for ExpressJS

> **Source**: [OWASP XSS Prevention Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
> 
> This document is an ExpressJS-specific adaptation of the official OWASP XSS Prevention Cheatsheet. The original cheatsheet is maintained by OWASP and can be found at the link above.

## 1. Input Validation & Sanitization

### Rule 1: Never Insert Untrusted Data Except in Allowed Locations
- **Detection**: Look for direct user input in response rendering
- **Implementation**: Check for `res.send()`, `res.render()`, `res.json()` with user input
- **Example Vulnerable Code**:
```javascript
app.get('/search', (req, res) => {
    res.send('<h1>Results for: ' + req.query.q + '</h1>');
});
```

### Rule 2: HTML Encode Before Inserting Untrusted Data into HTML Element Content
- **Detection**: Check for missing HTML encoding
- **Implementation**: Look for `escape-html`, `xss`, or similar libraries
- **Example Vulnerable Code**:
```javascript
app.post('/comment', (req, res) => {
    res.send(`<div>${req.body.comment}</div>`);
});
```

### Rule 3: JavaScript Encode Before Inserting Untrusted Data into JavaScript Data Values
- **Detection**: Check for user input in script tags or event handlers
- **Implementation**: Look for `JSON.stringify()` or proper encoding
- **Example Vulnerable Code**:
```javascript
app.get('/user', (req, res) => {
    res.send(`<script>var user = ${req.query.user};</script>`);
});
```

## 2. Security Headers & Middleware

### Rule 4: Content Security Policy (CSP)
- **Detection**: Check for Helmet CSP configuration
- **Implementation**: Look for `helmet.contentSecurityPolicy()`
- **Example Configuration**:
```javascript
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"]
    }
}));
```

### Rule 5: X-XSS-Protection Header
- **Detection**: Check for Helmet XSS protection
- **Implementation**: Look for `helmet.xssFilter()`
- **Example Configuration**:
```javascript
app.use(helmet.xssFilter());
```

## 3. Cookie Security

### Rule 6: Secure Cookie Configuration
- **Detection**: Check for cookie security flags
- **Implementation**: Look for `secure`, `httpOnly`, `sameSite` flags
- **Example Configuration**:
```javascript
app.use(session({
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
    }
}));
```

## 4. Template Engine Security

### Rule 7: Template Engine Configuration
- **Detection**: Check for template engine settings
- **Implementation**: Look for proper escaping settings
- **Example Configuration**:
```javascript
app.set('view engine', 'ejs');
app.locals.escape = true;
```

## 5. API Security

### Rule 8: JSON Response Security
- **Detection**: Check for proper JSON encoding
- **Implementation**: Look for `JSON.stringify()` usage
- **Example Vulnerable Code**:
```javascript
app.get('/api/user', (req, res) => {
    res.json({ name: req.query.name });
});
```

## 6. Database Security

### Rule 9: NoSQL Injection Prevention
- **Detection**: Check for direct user input in queries
- **Implementation**: Look for proper query sanitization
- **Example Vulnerable Code**:
```javascript
app.get('/users', (req, res) => {
    User.find({ name: req.query.name });
});
```

## 7. File Upload Security

### Rule 10: File Upload Validation
- **Detection**: Check for file upload handling
- **Implementation**: Look for file type validation
- **Example Vulnerable Code**:
```javascript
app.post('/upload', (req, res) => {
    const file = req.files.upload;
    file.mv('./uploads/' + file.name);
});
```

## 8. Error Handling

### Rule 11: Secure Error Messages
- **Detection**: Check for error message exposure
- **Implementation**: Look for proper error handling
- **Example Vulnerable Code**:
```javascript
app.use((err, req, res, next) => {
    res.status(500).send(err.message);
});
```

## 9. Session Security

### Rule 12: Session Management
- **Detection**: Check for session configuration
- **Implementation**: Look for proper session settings
- **Example Configuration**:
```javascript
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));
```

## 10. CORS Configuration

### Rule 13: CORS Security
- **Detection**: Check for CORS configuration
- **Implementation**: Look for proper CORS settings
- **Example Configuration**:
```javascript
app.use(cors({
    origin: 'https://trusted-site.com',
    methods: ['GET', 'POST']
}));
``` 
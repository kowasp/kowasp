# XSS Example Applications

This directory contains two ExpressJS applications demonstrating XSS vulnerabilities and their prevention.

## Applications

1. **Vulnerable App** (`vulnerable-app/`): Contains various XSS vulnerabilities
2. **Secure App** (`secure-app/`): Same functionality but with XSS prevention

## Setup

For each application:

```bash
cd vulnerable-app  # or secure-app
npm install
npm start
```

- Vulnerable app runs on: http://localhost:3000
- Secure app runs on: http://localhost:3001

## Testing XSS Vulnerabilities

### 1. Basic Reflected XSS
```
http://localhost:3000/search?q=<script>alert('XSS')</script>
```

### 2. Stored XSS
```bash
curl -X POST http://localhost:3000/comment -d "comment=<script>alert('XSS')</script>"
```

### 3. DOM-based XSS
```
http://localhost:3000/dom-xss?name=<script>alert('XSS')</script>
```

### 4. Event Handler XSS
```
http://localhost:3000/event-xss?input=alert('XSS')
```

### 5. JavaScript URL XSS
```
http://localhost:3000/js-url-xss?url=javascript:alert('XSS')
```

### 6. Filter Evasion Examples
```
http://localhost:3000/filter-evasion?input=<img src=x onerror=alert('XSS')>
http://localhost:3000/filter-evasion?input=<svg/onload=alert('XSS')>
http://localhost:3000/filter-evasion?input=<body onload=alert('XSS')>
```

## Prevention Techniques Demonstrated

1. **Input Validation**
   - URL validation
   - Content type checking

2. **Output Encoding**
   - HTML encoding
   - JavaScript encoding
   - URL encoding

3. **Security Headers**
   - Content Security Policy (CSP)
   - X-XSS-Protection
   - X-Content-Type-Options

4. **Safe DOM Manipulation**
   - Using textContent instead of innerHTML
   - Safe event handling

5. **Secure Cookie Handling**
   - HttpOnly flag
   - Secure flag
   - SameSite attribute

## Testing the Secure Version

Try the same payloads against the secure app (port 3001) to see how they are prevented:

```
http://localhost:3001/search?q=<script>alert('XSS')</script>
```

The secure app should:
1. Encode the input
2. Block execution via CSP
3. Prevent DOM-based XSS
4. Validate URLs
5. Sanitize user input

## Security Best Practices Demonstrated

1. Use of security middleware (helmet)
2. Input sanitization (xss package)
3. Output encoding
4. Content Security Policy
5. Safe DOM manipulation
6. URL validation
7. Secure cookie configuration 
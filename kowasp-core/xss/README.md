## OWASP TOP 10 - Injection

### XSS (Cross Site Scripting)
[OWASP Cross Site Scripting Definition](https://owasp.org/www-community/attacks/xss/)

- a code injection attack that allows an attacker to execute malicious scripts in another user's browser.
- occurs when a web application includes untrusted data in a new web page without proper validation or escaping.
- allows attackers to execute scripts in the victim's browser which can hijack user sessions, deface websites, or redirect the user to malicious sites.
- can be used to bypass access controls such as the same-origin policy.
- can be used to access sensitive data, like cookies or session tokens, and can be used to manipulate or deface web pages.
- can be used to exploit the browser and the user's trust in the website.
- can be used to access sensitive data, like cookies or session tokens, and can be used to manipulate or deface web pages.

According to the CWE, the following are the common types of XSS:


Type 0: DOM-Based XSS - In DOM-based XSS, the client performs the injection of XSS into the page; in the other types, the server performs the injection. DOM-based XSS generally involves server-controlled, trusted script that is sent to the client, such as Javascript that performs sanity checks on a form before the user submits it. If the server-supplied script processes user-supplied data and then injects it back into the web page (such as with dynamic HTML), then DOM-based XSS is possible. 


Type 1: Reflected XSS (or Non-Persistent) - The server reads data directly from the HTTP request and reflects it back in the HTTP response. Reflected XSS exploits occur when an attacker causes a victim to supply dangerous content to a vulnerable web application, which is then reflected back to the victim and executed by the web browser. The most common mechanism for delivering malicious content is to include it as a parameter in a URL that is posted publicly or e-mailed directly to the victim. URLs constructed in this manner constitute the core of many phishing schemes, whereby an attacker convinces a victim to visit a URL that refers to a vulnerable site. After the site reflects the attacker's content back to the victim, the content is executed by the victim's browser.


Type 2: Stored XSS (or Persistent) - The application stores dangerous data in a database, message forum, visitor log, or other trusted data store. At a later time, the dangerous data is subsequently read back into the application and included in dynamic content. From an attacker's perspective, the optimal place to inject malicious content is in an area that is displayed to either many users or particularly interesting users. Interesting users typically have elevated privileges in the application or interact with sensitive data that is valuable to the attacker. If one of these users executes malicious content, the attacker may be able to perform privileged operations on behalf of the user or gain access to sensitive data belonging to the user. For example, the attacker might inject XSS into a log message, which might not be handled properly when an administrator views the logs. 

[Read More About XSS](https://cwe.mitre.org/data/definitions/79.html)

### Guide

For security analysis, especially when dealing with JavaScript code that might be vulnerable (like Cross-Site Scripting), you can use tools such as ESLint or JSLint
etc., which are static analyze tool. However, they cannot directly detect the actual origin of your web application from XSS attacks in a full sense because these
tools run only on server side and do not execute client code at runtime like browser does when navigating to URLs through user-provided input (e.g. form data or
query parameters).

However, you can use some tricks such as:
1) Using the `innerHTML` property for injecting JavaScript into DOM which could potentially expose your application by XSS if not handled properly in client side
scripts - this is a simple example of possible harmful usage (it's just an illustration and actual code will be more complex).
2) Executable content like PDF documents, executables or even embedded images that open when clicked.  These can provide the same benefits as inline script
injection but using data URL instead of local file reference to execute on user side scripts which could expose your application by XSS if not handled properly in
client-side JavaScript/CSS code (e.g., through eval() or `new Function`).
3) Using CSS styles with JS content that changes the behavior and appearance dynamically - this is also a common way to make an attacker see work arounds for your
application if they are caught in XSS attacks but it'll be even harder because of its dynamic nature.  This could provide similar benefits as inline script
injection or data URL based methods, thus making them less detectable against standard cross-site scripts (XSS) risks than the latter method(es).
    -   Example: `<style type="text/css">body {background:#`${alert('You are being XSS attacked!')}; } </ style>` or  data URLs using JavaScript's fetch API.
(Please note, it may not be a practical solution for all use cases)
   - Example: `<script type=text/javascript>fetch('/bad_data') {window.location = xss;}`    in the case above this is more like an XSS payload than actual code
execution due to CORS issues and thus it's not a direct way for detecting such attacks, but using other methods could be effective (like data URL or JSONP
injection).
4) Using `eval()` function if attacker have control over your application.  This is also an indirect method that you may use in some cases to make the process more
difficult and less predictable by users for XSS attacks, but it's not a standard solution due its vulnerability (in terms of code injection)
5 ) Using Insecure Direct Object Reference(IDOR), where attacker uses data they do not own or has access too.  This can be seen as using an old and obsolete method
for detecting XSS attacks but it's true that is more difficult due to its dynamic nature in relation with user-supplied input (XSS payload).
6) Using a tool like SSRF(Server Side Request Forgery), which allows you provide the server address where your data should be sent. This will expose if XSS attacks
are used, as they can change URLs to execute requests on other sites or use techniques such as SQL Injection and command injection that could make it easier for
users (if not handled properly)
   - Example: `fetch('http://evil-corp/xss_attacks')`    in this case you need the server side code setup which should allow these types of attacks.  Please note,
SSRF is a method that can be more difficult to detect than other methods due its use with user provided data (XSS payload).
In summary: while ESLint and JSLint are good for simple XSS/CSRF attack detection because they run on server side only during analysis phase not in the client code
execution, it is impossible or unfeasible to make them directly detect full-fledged attacks such as Cross Site Scripting (XSS) through traditional methods.
A better approach would be using a combination of web application firewalls which can block and inspect all types XSS/CSRF attack attempts while also providing an
easy way for end users or developers to identify if their requests are safe, thus potentially reducing the risk associated with these attacks over time .

### Resources

#### Testing
- [Reflected Cross Site Scripting](https://owasp.org/www-project-web-security-testing-guide/v41/4-Web_Application_Security_Testing/07-Input_Validation_Testing/01-Testing_for_Reflected_Cross_Site_Scripting.html)
- [Stored Cross Site Scripting](https://owasp.org/www-project-web-security-testing-guide/v41/4-Web_Application_Security_Testing/07-Input_Validation_Testing/02-Testing_for_Stored_Cross_Site_Scripting.html)
- [DOM-based Cross Site Scripting](https://owasp.org/www-project-web-security-testing-guide/v41/4-Web_Application_Security_Testing/11-Client_Side_Testing/01-Testing_for_DOM-based_Cross_Site_Scripting.html)


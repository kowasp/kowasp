## KOwasp

KOwasp is an automated tooling that detects security vulnerabilities in web applications. <br /> 
It uses pre-configured rule sets for scanning and further enhances the accuracy with AI powered SVP. <br /> 
It primarily focuses on identifying the OWASP Top 10 2021. <br />
KOwasp is a static code analysis tool that scans the source code of web applications to identify potential security vulnerabilities. <br /> 
It is designed to be a one-click solution used by developers and security professionals to identify and fix security vulnerabilities in web applications.

## Features

This project temporarily focuses on detecting XSS attacks only. <br />
It sends the results to the server and the server will use the AI model (Deepseek Coder) to predict the severity of the detected vulnerabilities, accuracy, and the confidence level of the prediction. <br />
The web server contains a dashboard that displays the results of the scan and the prediction results. <br />
It uses NextJS for the frontend and NestJS for the backend. <br />

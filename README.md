# KOWASP Security Scanner

A comprehensive web-based security scanner for Express.js applications that detects Cross-Site Scripting (XSS) vulnerabilities **and checks security configurations** using the OWASP XSS Prevention Cheat Sheet.

## Features

- **User Authentication**: Secure login/signup with JWT tokens
- **Project Management**: Create and manage projects with Git repository URLs
- **Security Scanning**: Automated XSS vulnerability **and security config** detection using kowasp-core
- **Detailed Reports**: View comprehensive scan results with remediation advice, Express config, and missing security headers
- **Admin Dashboard**: Platform-wide statistics and user management
- **Role-based Access**: Different permissions for users and administrators

## Architecture

- **Frontend**: Next.js (15+) with TypeScript, Tailwind CSS, and React Query
- **Backend**: NestJS (10+) with TypeScript, MongoDB, and JWT authentication
- **Scanner**: Custom kowasp-core engine for XSS and security config detection (supports optional LLM-powered analysis)
- **Database**: MongoDB for data persistence

## Quick Start

### Prerequisites

- Node.js 18+ (backend), Node.js 16+ (core)
- MongoDB instance
- Git
- (Optional) [Ollama](https://ollama.com/) with Mistral model for LLM-powered analysis

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd kowasp-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/kowasp
   JWT_SECRET=your-super-secret-jwt-key-here
   ```
4. Start the development server:
   ```bash
   npm run start:dev
   ```
The backend will be available at `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd kowasp-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
The frontend will be available at `http://localhost:3000`

### Core Engine (kowasp-core)

The core scanning engine can be used standalone for CLI analysis or as part of the backend service.

#### Prerequisites
- Node.js 16+
- (Optional) Ollama with Mistral model for LLM-powered context analysis

#### Usage
```bash
cd kowasp-core
npm install
npm run build
# Analyze a project directory
npm run analyze -- /path/to/your/express/app
```
To enable LLM-powered analysis, ensure Ollama is running:
```bash
ollama run mistral
```

## Usage

1. **Sign Up**: Create a new account at `http://localhost:3000/signup`
2. **Login**: Access your dashboard at `http://localhost:3000/login`
3. **Create Project**: Add a new project with a Git repository URL
4. **Run Scan**: Trigger a security scan for your project
5. **View Results**: Review detailed vulnerability reports, Express config, missing security headers, and remediation advice

## Scanning Features

### Project Scanning
- **Git Repository Scanning**: Connect your project to a Git repository and run automated scans
- **Historical Results**: Track scan results over time with detailed reports

### File Scanning
- **Single File Analysis**: Paste code directly into the Monaco editor for instant analysis
- **Real-time Results**: Get immediate feedback on potential vulnerabilities

### Directory Scanning
- **Directory Upload**: Upload entire directories with all files and subdirectories (supports both ZIP and multi-file upload)
- **Zip File & Multi-file Support**: Upload compressed directories as ZIP files or upload multiple files preserving directory structure
- **Preserved Structure**: Maintains original directory structure during analysis
- **Multiple File Types**: Analyzes JavaScript, TypeScript, and other web files

### Security Configuration Checks
- **Express Security Config**: Detects missing or misconfigured security middleware (e.g., helmet, CSP, HSTS)
- **Missing Security Headers**: Reports on missing recommended HTTP security headers

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `DELETE /api/projects/:id` - Delete project

### Scans
- `POST /api/scans/project/:projectId` - Start new scan
- `GET /api/scans/project/:projectId` - List project scans
- `GET /api/scans/:id` - Get scan results
- `POST /api/scans/code` - Scan single file code
- `POST /api/scans/upload-directory` - Scan uploaded ZIP directory
- `POST /api/scans/upload-directory-files` - Scan uploaded directory files (multi-file upload, preserves structure)

### Admin (Admin role required)
- `GET /api/admin/users` - List all users
- `GET /api/admin/projects` - List all projects
- `GET /api/admin/scans` - List all scans

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Secure API endpoints
- Express security configuration and header checks

## Testing

### Backend
```bash
cd kowasp-backend
npm run test         # unit tests
npm run test:e2e     # end-to-end tests
npm run test:cov     # test coverage
```

### Core Engine
```bash
cd kowasp-core
npm run test         # unit tests
```

### Frontend
Currently, no client-side tests are configured.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

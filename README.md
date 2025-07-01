# KOWASP Security Scanner

A comprehensive security scanner for Express.js applications that detects Cross-Site Scripting (XSS) vulnerabilities and checks security configurations using the OWASP XSS Prevention Cheat Sheet. Supports project, file, and directory scanning, with advanced reporting and optional AI-powered analysis.

## Features

- **User Authentication**: Secure login/signup with JWT tokens
- **Project Management**: Create and manage projects with Git repository URLs
- **Flexible Scanning**:
  - **Project Scanning**: Analyze entire repositories
  - **File Scanning**: Paste code into Monaco Editor for instant results
  - **Directory Scanning**: Upload zipped or multi-file directories
- **Automated XSS & Security Config Detection**: Uses kowasp-core engine for static and (optionally) LLM-powered analysis
- **Detailed Reports**: Severity, location, code snippet, remediation, and confidence score
- **Express Security Checks**: Detects missing/misconfigured middleware and headers
- **Admin Dashboard**: Platform-wide statistics and user management
- **Role-based Access**: User and admin permissions
- **Async Scanning Service**: Scans run in the background for large projects

## Architecture

- **Frontend**: Next.js (TypeScript, Tailwind CSS, React Query)
- **Backend**: NestJS (TypeScript, MongoDB, JWT)
- **Core Engine**: Standalone CLI (kowasp-core) for static and AI-powered analysis
- **Database**: MongoDB
- **Async Scanning Service**: Background worker for queued scans

```mermaid
graph TD
    subgraph "Browser"
        Frontend[Next.js App]
    end

    subgraph "Server"
        Backend[NestJS API]
        ScanningService[Async Scanning Service]
        Database[(MongoDB)]
    end

    subgraph "External"
        CodeRepo[Git Repository]
        CoreEngine[kowasp-core]
    end

    Frontend -- HTTP/S --> Backend
    Backend -- interacts with --> Database
    Backend -- triggers --> ScanningService
    ScanningService -- clones from --> CodeRepo
    ScanningService -- uses --> CoreEngine
    ScanningService -- writes results to --> Database
```

## Quick Start

### Prerequisites

- Node.js 18+ (backend), Node.js 16+ (core)
- MongoDB instance (local or Docker)
- Git
- (Optional) [Ollama](https://ollama.com/) with Mistral model for LLM-powered analysis

### MongoDB with Docker

```sh
docker-compose up -d mongo
```

- **Host:** `localhost`  **Port:** `27017`  **Username:** `root`  **Password:** `example`
- Example connection: `mongodb://root:example@localhost:27017/`

### Backend Setup

```bash
cd kowasp-backend
npm install
# Create .env with:
# MONGODB_URI=mongodb://localhost:27017/kowasp
# JWT_SECRET=your-super-secret-jwt-key-here
npm run start:dev
# Backend: http://localhost:3001
```

### Frontend Setup

```bash
cd kowasp-frontend
npm install
npm run dev
# Frontend: http://localhost:3000
```

### Core Engine (kowasp-core)

The core scanning engine can be used standalone for CLI analysis or as part of the backend service.

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

### Web Platform
1. **Sign Up**: http://localhost:3000/signup
2. **Login**: http://localhost:3000/login
3. **Create Project**: Add a new project with a Git repository URL
4. **Run Scan**: Trigger a scan for your project, upload a directory, or analyze a single file
5. **View Results**: Review detailed vulnerability reports, Express config, missing headers, and remediation advice

### CLI (kowasp-core)
- Analyze any Express app or directory from the terminal (see above)

### API
- See [API Endpoints](#api-endpoints) below for programmatic access

## Scanning Features

- **Project Scanning**: Connect to a Git repository and scan the entire project
- **File Scanning**: Paste code into Monaco Editor for instant analysis
- **Directory Scanning**: Upload zipped or multi-file directories (structure preserved)
- **Multiple File Types**: JavaScript, TypeScript, and web files
- **Express Security Config Checks**: Detects missing/misconfigured middleware (helmet, CSP, HSTS, etc.)
- **Missing Security Headers**: Reports on missing HTTP security headers
- **LLM/AI Analysis**: (Optional) Context-aware analysis, false positive reduction, and custom remediation (requires Ollama)
- **Async Scanning**: Large scans are queued and processed in the background

## Output & Reporting

- **Vulnerability Type** (reflected, stored, DOM-based, etc.)
- **Severity**
- **Location** (file and line number)
- **Description**
- **Code snippet**
- **Remediation suggestion**
- **Confidence score**
- **Express Security Configuration**
- **Missing Security Headers**
- **Recommendations**

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
- `POST /api/scans/upload-directory-files` - Scan uploaded directory files (multi-file upload)

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

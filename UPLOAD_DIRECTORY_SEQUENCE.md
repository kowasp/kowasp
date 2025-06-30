# Upload Directory Feature - Sequence Diagram

This sequence diagram shows the flow for uploading directories to the KOWASP security scanner, with support for both directory upload and zip file upload options.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant FS as File System
    participant A as XSS Analyzer

    Note over U,A: Directory Upload Flow
    U->>F: Click "Scan Directory"
    F->>F: Open modal with upload options
    U->>F: Select "Directory" option
    U->>F: Choose folder with files
    F->>F: Display file count
    U->>F: Click "Scan"
    F->>F: Create FormData with files
    F->>B: POST /scans/upload-directory-files
    B->>FS: Create temp directory
    B->>B: Process each file
    B->>FS: Recreate directory structure
    B->>A: Analyze directory
    A->>B: Return results
    B->>FS: Cleanup temp directory
    B->>F: Return scan results
    F->>U: Display findings

    Note over U,A: Zip File Upload Flow
    U->>F: Select "Zip File" option
    U->>F: Choose .zip file
    F->>F: Display file name
    U->>F: Click "Scan"
    F->>B: POST /scans/upload-directory
    B->>FS: Create temp directory
    B->>FS: Extract zip file
    B->>A: Analyze extracted directory
    A->>B: Return results
    B->>FS: Cleanup temp directory
    B->>F: Return scan results
    F->>U: Display findings

    Note over U,A: Error Handling
    alt File Upload Error
        B->>F: Return error response
        F->>F: Display error message
        F->>U: Show error notification
    else Analysis Error
        A->>B: Throw analysis error
        B->>FS: Clean up temporary directory
        B->>F: Return error response
        F->>F: Display error message
        F->>U: Show error notification
    end
```

## Key Components

### Frontend (Next.js)
- **ScanDirectoryModal**: Modal component with upload type selection
- **File Handling**: Processes directory selection and zip file selection
- **FormData Creation**: Prepares files for upload with proper paths
- **Result Display**: Shows scan results in formatted view

### Backend (NestJS)
- **FilesInterceptor**: Handles multiple file uploads for directory
- **FileInterceptor**: Handles single file upload for zip
- **Directory Processing**: Recreates directory structure from uploaded files
- **Zip Processing**: Extracts zip files and finds root directory
- **Analysis Integration**: Calls kowasp-core XSSAnalyzer
- **Result Transformation**: Converts analyzer results to frontend format

### File System Operations
- **Temporary Directory Creation**: Creates unique temp directories
- **Directory Structure Recreation**: Maintains original file paths
- **File Writing**: Writes uploaded files to correct locations
- **Cleanup**: Removes temporary directories after analysis

### XSS Analyzer (kowasp-core)
- **Directory Scanning**: Analyzes all files in uploaded directory
- **Vulnerability Detection**: Identifies XSS vulnerabilities
- **Result Generation**: Returns structured analysis results

## Upload Options

### Directory Upload
1. User selects "Directory" option
2. File picker opens with directory selection enabled
3. User selects a folder containing files
4. All files and subdirectories are uploaded with preserved structure
5. Backend recreates the exact directory structure
6. Analysis runs on the complete directory

### Zip File Upload
1. User selects "Zip File" option
2. File picker opens with .zip file filter
3. User selects a compressed directory
4. Backend extracts the zip file
5. Analysis runs on the extracted contents
6. Maintains backward compatibility with existing functionality

## Error Handling

- **File Upload Errors**: Network issues, file size limits, invalid file types
- **Directory Processing Errors**: Missing paths, permission issues
- **Analysis Errors**: Invalid code, analyzer failures
- **Cleanup Errors**: Temporary directory removal failures

All errors are properly handled and displayed to the user with meaningful messages. 
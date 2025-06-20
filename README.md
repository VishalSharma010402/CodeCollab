# CodeCollab - Collaborative Code Editor

A real-time collaborative code editor built with React, Vite, and Socket.IO. This application allows multiple users to join a coding room and edit code together in real-time.

## Features

- Real-time code collaboration
- Multiple users can join the same room
- Complete file and folder management:
  - Create files with various extensions
  - Create folders for organization
  - Delete files and folders (including nested content)
  - Navigate between files in your project
- Syntax highlighting for multiple languages
- Integrated terminal for code execution:
  - Server-side execution for Python, JavaScript, and Java
  - Client-side simulation for other languages
  - Real-time output display
  - Error handling and debugging
- Code error detection and correction
- Programming language selection
- Color-coded editor based on language
- Minimalist design
- WebSocket communication
- Copy room ID to invite others

## Supported Languages

The editor supports multiple programming languages including:
- JavaScript
- Python
- Java
- C#
- C++
- PHP
- Ruby
- Swift
- Go
- Rust
- HTML
- CSS

## Syntax Highlighting

CodeCollab provides syntax highlighting for all supported languages, making code easier to read and understand. The highlighting is powered by Prism.js and automatically adjusts to the selected language.

## Terminal Output

The editor includes an integrated terminal that shows the output of your code. You can:
- Run your code directly in the browser (JavaScript)
- Execute Python, JavaScript, and Java code on the server
- See simulated output for other languages
- View execution errors and warnings
- Clear the terminal output
- Enter input for interactive programs

### Server-Side Execution

For supported languages (Python, JavaScript, Java), the terminal will attempt to execute code on the server. This requires:
- Python installed on the server for Python execution
- Node.js installed on the server for JavaScript execution
- Java installed on the server for Java execution

If server-side execution is not available, the terminal falls back to client-side simulation.

## File Management

CodeCollab includes a built-in file explorer that allows you to:
- Create new files with different extensions
- Create folders for organizing your project
- Delete files and folders (with confirmation)
- Automatically closes files when their containing folder is deleted
- Navigate between files in your project
- Automatic language detection based on file extension

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python (optional, for Python code execution)
- Java (optional, for Java code execution)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd codecollab
```

2. Install dependencies for the client:
```bash
npm install
```

3. Install dependencies for the server:
```bash
cd server
npm install
cd ..
```

## Running the Application

### Start the WebSocket server:

```bash
cd server
npm run dev
```

The server will run on http://localhost:3001.

### Start the React client:

In a new terminal window:
```bash
npm run dev
```

The client will run on http://localhost:5173 (or another port if 5173 is busy).

### Start both client and server concurrently:

```bash
npm run dev
```

## How to Use

1. Open the application in your browser
2. Enter a room ID (create a new one or join an existing one)
3. Enter your username
4. Use the file explorer to create, navigate, and delete files and folders
5. Select your preferred programming language from the dropdown
6. Write your code with syntax highlighting
7. Toggle the terminal to run your code and see results
8. Share the room ID with others to collaborate

## Technologies Used

- React
- Vite
- Socket.IO
- Express.js
- Prism.js (syntax highlighting)
- CSS

## License

MIT

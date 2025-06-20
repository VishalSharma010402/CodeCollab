const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  // Vercel-specific configuration for WebSocket support
  transports: ['websocket', 'polling'],
  path: '/api/socket.io'
});

// Store active rooms and their content
const rooms = {};

// Helper function to get a nested property
const getNestedProperty = (obj, path) => {
  const parts = path.split('/');
  let current = obj;

  for (const part of parts) {
    if (part === '') continue;
    if (!current[part]) return null;
    current = current[part];
  }

  return current;
};

// Helper function to set a nested property
const setNestedProperty = (obj, path, value) => {
  const parts = path.split('/');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part === '') continue;
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
};

// Helper function to delete a nested property
const deleteNestedProperty = (obj, path) => {
  const parts = path.split('/');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part === '') continue;
    if (!current[part]) return false;
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  if (current[lastPart] === undefined) return false;

  delete current[lastPart];
  return true;
};

// Helper function to check if a path is within a folder
const isPathInFolder = (path, folderPath) => {
  return path.startsWith(folderPath + '/');
};

// Helper function to check if object is empty
const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

// Code execution helper
const executeCode = async (code, language) => {
  return new Promise((resolve) => {
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    
    let filename, command;
    
    switch (language) {
      case 'python':
        filename = path.join(tempDir, `code_${timestamp}.py`);
        command = `python "${filename}"`;
        break;
      case 'javascript':
        filename = path.join(tempDir, `code_${timestamp}.js`);
        command = `node "${filename}"`;
        break;
      case 'java':
        filename = path.join(tempDir, `Code_${timestamp}.java`);
        command = `javac "${filename}" && java -cp "${tempDir}" Code_${timestamp}`;
        break;
      default:
        resolve({ success: false, output: `Language ${language} not supported for server-side execution` });
        return;
    }
    
    fs.writeFile(filename, code)
      .then(() => {
        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
          // Clean up the file
          fs.unlink(filename).catch(() => {});
          
          if (error) {
            resolve({ success: false, output: stderr || error.message });
          } else {
            resolve({ success: true, output: stdout });
          }
        });
      })
      .catch(err => {
        resolve({ success: false, output: `File creation error: ${err.message}` });
      });
  });
};

// REST endpoint for code execution
app.post('/api/execute', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }
    
    const result = await executeCode(code, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Join a room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { 
        code: '', 
        users: [],
        languageId: 'javascript', // Default language
        files: {
          'main.js': '// Welcome to CodeCollab!\n// Start coding here...\nconsole.log("Hello, World!");',
          'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>',
          'styles': {
            'main.css': 'body {\n  font-family: sans-serif;\n}'
          }
        },
        currentFile: 'main.js'
      };
    }
    
    // Add user to room
    rooms[roomId].users.push(socket.id);
    
    // Send current code, language, and files to the joining user
    socket.emit('initial_data', {
      code: rooms[roomId].code,
      languageId: rooms[roomId].languageId,
      files: rooms[roomId].files,
      currentFile: rooms[roomId].currentFile
    });
    
    // Notify others that someone joined
    io.to(roomId).emit('user_joined', { users: rooms[roomId].users });
  });

  // Handle code updates
  socket.on('code_change', (data) => {
    const { roomId, code, languageId, filePath } = data;
    
    // Update room code
    if (rooms[roomId]) {
      if (filePath) {
        // Update code for specific file
        const fileContent = getNestedProperty(rooms[roomId].files, filePath);
        if (typeof fileContent === 'string') {
          setNestedProperty(rooms[roomId].files, filePath, code);
        }
      } else {
        // Update main code (legacy support)
        rooms[roomId].code = code;
      }

      if (languageId) {
        rooms[roomId].languageId = languageId;
      }
    }
    
    // Broadcast to all users in the room (including sender)
    io.to(roomId).emit('code_update', {
      code,
      languageId: rooms[roomId].languageId,
      filePath
    });
  });

  // Handle language change
  socket.on('language_change', (data) => {
    const { roomId, languageId } = data;
    
    // Update room language
    if (rooms[roomId] && languageId) {
      rooms[roomId].languageId = languageId;
      
      // Broadcast to all users in the room except sender
      socket.to(roomId).emit('language_change', languageId);
    }
  });

  // Handle file operations
  socket.on('create_file', (data) => {
    const { roomId, filePath, content } = data;
    
    if (rooms[roomId]) {
      setNestedProperty(rooms[roomId].files, filePath, content || '');
      
      // Broadcast file creation to all users in the room
      io.to(roomId).emit('file_created', {
        filePath,
        files: rooms[roomId].files
      });
    }
  });

  socket.on('create_folder', (data) => {
    const { roomId, folderPath } = data;
    
    if (rooms[roomId]) {
      setNestedProperty(rooms[roomId].files, folderPath, {});
      
      // Broadcast folder creation to all users in the room
      io.to(roomId).emit('folder_created', {
        folderPath,
        files: rooms[roomId].files
      });
    }
  });

  socket.on('delete_file', (data) => {
    const { roomId, filePath } = data;
    
    if (rooms[roomId]) {
      deleteNestedProperty(rooms[roomId].files, filePath);
      
      // Broadcast file deletion to all users in the room
      io.to(roomId).emit('file_deleted', {
        filePath,
        files: rooms[roomId].files
      });
    }
  });

  socket.on('delete_folder', (data) => {
    const { roomId, folderPath } = data;
    
    if (rooms[roomId]) {
      // Delete the folder and all its contents
      deleteNestedProperty(rooms[roomId].files, folderPath);
      
      // Reset current file if it was in the deleted folder
      if (rooms[roomId].currentFile && isPathInFolder(rooms[roomId].currentFile, folderPath)) {
        rooms[roomId].currentFile = '';
      }
      
      // Broadcast folder deletion to all users in the room
      io.to(roomId).emit('folder_deleted', {
        folderPath,
        files: rooms[roomId].files
      });
    }
  });

  socket.on('select_file', (data) => {
    const { roomId, filePath } = data;
    if (rooms[roomId]) {
      rooms[roomId].currentFile = filePath;
      // Get the latest file content
      let fileContent = null;
      const parts = filePath.split('/');
      let current = rooms[roomId].files;
      for (let i = 0; i < parts.length; i++) {
        if (!current[parts[i]]) break;
        current = current[parts[i]];
      }
      if (typeof current === 'string') fileContent = current;
      // Broadcast file selection to all users in the room except sender
      socket.to(roomId).emit('file_selected', {
        filePath,
        fileContent
      });
    }
  });

  // Handle cursor position updates
  socket.on('cursor_position', (data) => {
    const { roomId, position, userId } = data;
    socket.to(roomId).emit('cursor_update', { position, userId });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    
    // Remove user from all rooms they were in
    for (const roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(id => id !== socket.id);
      
      // Notify others that user left
      io.to(roomId).emit('user_left', { users: rooms[roomId].users });
      
      // Clean up empty rooms
      if (rooms[roomId].users.length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 
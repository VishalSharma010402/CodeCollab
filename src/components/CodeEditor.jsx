import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import '../styles/CodeEditor.css';
import FileExplorer from './FileExplorer';
import CodeHighlighter from './CodeHighlighter';
import Terminal from './Terminal';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', mode: 'javascript' },
  { id: 'python', name: 'Python', mode: 'python' },
  { id: 'java', name: 'Java', mode: 'java' },
  { id: 'csharp', name: 'C#', mode: 'csharp' },
  { id: 'cpp', name: 'C++', mode: 'cpp' },
  { id: 'php', name: 'PHP', mode: 'php' },
  { id: 'ruby', name: 'Ruby', mode: 'ruby' },
  { id: 'swift', name: 'Swift', mode: 'swift' },
  { id: 'go', name: 'Go', mode: 'go' },
  { id: 'rust', name: 'Rust', mode: 'rust' },
  { id: 'html', name: 'HTML', mode: 'html' },
  { id: 'css', name: 'CSS', mode: 'css' },
];

const getLanguageFromFilename = (filename) => {
  const ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  
  switch (ext) {
    case 'js': return 'javascript';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'cs': return 'csharp';
    case 'cpp': case 'c': case 'h': return 'cpp';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'swift': return 'swift';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'html': case 'htm': return 'html';
    case 'css': return 'css';
    default: return 'javascript';
  }
};

const CodeEditor = ({ room, username }) => {
  const [code, setCode] = useState('');
  const [files, setFiles] = useState({});
  const [currentFile, setCurrentFile] = useState('');
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [showTerminal, setShowTerminal] = useState(false);
  const socketRef = useRef(null);
  const userId = useRef(username + '-' + Math.random().toString(36).substr(2, 9));

  // Connect to the WebSocket server
  useEffect(() => {
    socketRef.current = io({
      path: '/api/socket.io'
    });
    const socket = socketRef.current;
    
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', room);
    });
    
    socket.on('connect_error', () => {
      setError('Failed to connect to the server');
      setConnected(false);
    });
    
    socket.on('initial_data', (initialData) => {
      if (initialData) {
        // Handle file data
        if (initialData.files) {
          setFiles(initialData.files);
        }
        
        // Handle current file
        if (initialData.currentFile) {
          setCurrentFile(initialData.currentFile);
          // Get content from current file
          setCodeFromFile(initialData.files, initialData.currentFile);
          
          // Set language based on file extension
          const languageId = getLanguageFromFilename(initialData.currentFile);
          const lang = LANGUAGES.find(l => l.id === languageId) || LANGUAGES[0];
          setLanguage(lang);
        } else if (initialData.code) {
          setCode(initialData.code);
        }
        
        // Handle language
        if (initialData.languageId) {
          const lang = LANGUAGES.find(l => l.id === initialData.languageId) || LANGUAGES[0];
          setLanguage(lang);
        }
      }
    });
    
    socket.on('code_update', (updatedData) => {
      if (updatedData) {
        if (updatedData.filePath && updatedData.filePath === currentFile) {
          setCode(updatedData.code || '');
        } else if (!updatedData.filePath) {
          setCode(updatedData.code || '');
        }
        
        if (updatedData.languageId) {
          const lang = LANGUAGES.find(l => l.id === updatedData.languageId) || LANGUAGES[0];
          setLanguage(lang);
        }
      }
    });
    
    socket.on('language_change', (languageId) => {
      const lang = LANGUAGES.find(l => l.id === languageId) || LANGUAGES[0];
      setLanguage(lang);
    });
    
    socket.on('user_joined', (data) => {
      setUsers(data.users);
    });
    
    socket.on('user_left', (data) => {
      setUsers(data.users);
    });
    
    socket.on('file_created', (data) => {
      setFiles(data.files);
    });
    
    socket.on('folder_created', (data) => {
      setFiles(data.files);
    });
    
    socket.on('file_deleted', (data) => {
      setFiles(data.files);
      if (data.filePath === currentFile) {
        setCurrentFile('');
        setCode('');
      }
    });
    
    socket.on('folder_deleted', (data) => {
      setFiles(data.files);
      
      // Check if the current file was in the deleted folder
      if (currentFile && currentFile.startsWith(data.folderPath + '/')) {
        setCurrentFile('');
        setCode('');
      }
    });
    
    socket.on('file_selected', (data) => {
      if (data.filePath) {
        setCurrentFile(data.filePath);
        setCodeFromFile(files, data.filePath);
        
        // Update language based on file extension
        const languageId = getLanguageFromFilename(data.filePath);
        const lang = LANGUAGES.find(l => l.id === languageId) || LANGUAGES[0];
        setLanguage(lang);
      }
    });
    
    socket.on('cursor_update', (data) => {
      // Implement cursor highlighting if needed
      console.log('Cursor update:', data);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [room]);
  
  // Helper function to extract code from a file path in the file structure
  const setCodeFromFile = (fileStructure, filePath) => {
    if (!filePath || !fileStructure) return;
    
    const parts = filePath.split('/');
    let current = fileStructure;
    
    for (let i = 0; i < parts.length; i++) {
      if (!current[parts[i]]) return;
      current = current[parts[i]];
    }
    
    if (typeof current === 'string') {
      setCode(current);
    }
  };
  
  // Handle code changes
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    
    if (socketRef.current && connected) {
      socketRef.current.emit('code_change', {
        roomId: room,
        code: newCode,
        languageId: language.id,
        filePath: currentFile
      });
    }
  };
  
  // Handle language changes
  const handleLanguageChange = (e) => {
    const languageId = e.target.value;
    const selectedLanguage = LANGUAGES.find(lang => lang.id === languageId) || LANGUAGES[0];
    setLanguage(selectedLanguage);
    
    if (socketRef.current && connected) {
      socketRef.current.emit('language_change', {
        roomId: room,
        languageId: selectedLanguage.id
      });
    }
  };
  
  // Handle file selection
  const handleFileSelect = (filePath) => {
    setCurrentFile(filePath);
    setCodeFromFile(files, filePath);
    
    // Update language based on file extension
    const languageId = getLanguageFromFilename(filePath);
    const lang = LANGUAGES.find(l => l.id === languageId) || LANGUAGES[0];
    setLanguage(lang);
    
    if (socketRef.current && connected) {
      socketRef.current.emit('select_file', {
        roomId: room,
        filePath
      });
    }
  };
  
  // Handle file creation
  const handleFileCreate = (fileName) => {
    const filePath = fileName.includes('/') ? fileName : fileName;
    
    if (socketRef.current && connected) {
      socketRef.current.emit('create_file', {
        roomId: room,
        filePath,
        content: ''
      });
    }
  };
  
  // Handle folder creation
  const handleFolderCreate = (folderName) => {
    const folderPath = folderName.includes('/') ? folderName : folderName;
    
    if (socketRef.current && connected) {
      socketRef.current.emit('create_folder', {
        roomId: room,
        folderPath
      });
    }
  };
  
  // Handle file deletion
  const handleFileDelete = (filePath) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('delete_file', {
        roomId: room,
        filePath
      });
    }
  };
  
  // Handle folder deletion
  const handleFolderDelete = (folderPath) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('delete_folder', {
        roomId: room,
        folderPath
      });
    }
  };
  
  // Handle cursor position
  const handleCursorPosition = (position) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('cursor_position', {
        roomId: room,
        position,
        userId: userId.current
      });
    }
  };
  
  // Toggle terminal visibility
  const toggleTerminal = () => {
    setShowTerminal(prev => !prev);
  };
  
  // Copy room ID
  const copyRoomId = () => {
    navigator.clipboard.writeText(room)
      .then(() => {
        alert('Room ID copied to clipboard!');
      })
      .catch(() => {
        alert('Failed to copy room ID');
      });
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1 className="editor-title">CodeCollab</h1>
        <div className="header-right-panel">
          <div className="room-info">
            <span>Room: {room}</span>
            <button onClick={copyRoomId} className="copy-button">
              Copy ID
            </button>
          </div>
          <div className="editor-actions">
            <div className="language-selector">
              <select 
                value={language.id}
                onChange={handleLanguageChange}
                className="language-select"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <button 
              className={`terminal-toggle ${showTerminal ? 'active' : ''}`}
              onClick={toggleTerminal}
            >
              {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
            </button>
          </div>
          <div className="connection-status">
            {connected ? (
              <span className="connected">Connected</span>
            ) : (
              <span className="disconnected">Disconnected</span>
            )}
          </div>
        </div>
      </div>
      
      {error && <div className="error-banner">{error}</div>}
      
      <div className="editor-main">
        <div className="editor-sidebar">
          <FileExplorer 
            files={files}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFolderCreate={handleFolderCreate}
            onFileDelete={handleFileDelete}
            onFolderDelete={handleFolderDelete}
            currentFile={currentFile}
          />
          <div className="users-panel">
            <h3>Users in Room</h3>
            <ul>
              {users.map((user, index) => (
                <li key={index}>{user === socketRef.current?.id ? 'You' : `User ${index + 1}`}</li>
              ))}
            </ul>
            <div className="language-info">
              <h3>Current Language</h3>
              <div className="language-badge">{language.name}</div>
            </div>
          </div>
        </div>
        
        <div className="code-editor-container">
          <div className="code-panel">
            {currentFile ? (
              <>
                <div className="file-path">
                  {currentFile}
                </div>
                <div className="editor-content">
                  <CodeHighlighter
                    code={code}
                    language={language.id}
                    onChange={handleCodeChange}
                    onCursorPositionChange={handleCursorPosition}
                  />
                </div>
              </>
            ) : (
              <div className="no-file-selected">
                <p>No file selected. Please select a file from the explorer or create a new one.</p>
              </div>
            )}
          </div>
          
          {showTerminal && currentFile && (
            <Terminal 
              code={code} 
              language={language.id} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor; 
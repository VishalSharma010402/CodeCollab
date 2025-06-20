import { useState } from 'react';
import '../styles/FileExplorer.css';

const FileExplorer = ({ files, onFileSelect, onFileCreate, onFolderCreate, onFileDelete, onFolderDelete, currentFile }) => {
  const [newItemName, setNewItemName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});

  const getFileExtension = (filename) => {
    return filename.indexOf('.') > -1 ? 
      filename.substring(filename.lastIndexOf('.') + 1).toLowerCase() : '';
  };

  const getFileIcon = (filename) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case 'js': return '📄 ';
      case 'py': return '🐍 ';
      case 'java': return '☕ ';
      case 'html': return '🌐 ';
      case 'css': return '🎨 ';
      case 'json': return '📋 ';
      case 'md': return '📝 ';
      case 'txt': return '📄 ';
      default: return '📄 ';
    }
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleNewItemSubmit = (e) => {
    e.preventDefault();
    if (newItemName.trim()) {
      if (isCreatingFile) {
        onFileCreate(newItemName);
      } else if (isCreatingFolder) {
        onFolderCreate(newItemName);
      }
      setNewItemName('');
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
    }
  };

  const handleFileDelete = (e, path) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete file "${path}"?`)) {
      onFileDelete(path);
    }
  };

  const handleFolderDelete = (e, path) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete folder "${path}" and all its contents?`)) {
      onFolderDelete(path);
    }
  };

  const renderFileTree = (fileTree, basePath = '') => {
    return Object.keys(fileTree).map(name => {
      const path = basePath ? `${basePath}/${name}` : name;
      const isFolder = typeof fileTree[name] === 'object';
      
      if (isFolder) {
        const isExpanded = expandedFolders[path];
        return (
          <div key={path} className="file-item">
            <div 
              className={`folder ${isExpanded ? 'expanded' : ''}`} 
              onClick={() => toggleFolder(path)}
            >
              {isExpanded ? '📂 ' : '📁 '}{name}
              <button 
                className="delete-btn folder-delete-btn"
                onClick={(e) => handleFolderDelete(e, path)}
                title="Delete folder"
              >
                ×
              </button>
            </div>
            {isExpanded && (
              <div className="file-children">
                {renderFileTree(fileTree[name], path)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div 
            key={path} 
            className={`file-item ${currentFile === path ? 'selected' : ''}`}
            onClick={() => onFileSelect(path)}
          >
            <span className="file-name">
              {getFileIcon(name)}{name}
            </span>
            <button 
              className="delete-btn"
              onClick={(e) => handleFileDelete(e, path)}
              title="Delete file"
            >
              ×
            </button>
          </div>
        );
      }
    });
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <h3>Files</h3>
        <div className="explorer-actions">
          <button 
            className="new-file-btn"
            onClick={() => {
              setIsCreatingFile(true);
              setIsCreatingFolder(false);
            }}
          >
            New File
          </button>
          <button 
            className="new-folder-btn"
            onClick={() => {
              setIsCreatingFolder(true);
              setIsCreatingFile(false);
            }}
          >
            New Folder
          </button>
        </div>
      </div>
      
      {(isCreatingFile || isCreatingFolder) && (
        <form onSubmit={handleNewItemSubmit} className="new-item-form">
          <input
            type="text"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder={isCreatingFile ? "filename.ext" : "folder name"}
            autoFocus
          />
          <div className="form-actions">
            <button type="submit">Create</button>
            <button type="button" onClick={() => {
              setIsCreatingFile(false);
              setIsCreatingFolder(false);
              setNewItemName('');
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}
      
      <div className="file-tree">
        {renderFileTree(files)}
      </div>
    </div>
  );
};

export default FileExplorer; 
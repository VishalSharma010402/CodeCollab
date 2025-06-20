import { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';
import '../styles/CodeHighlighter.css';

const CodeHighlighter = ({ 
  code, 
  language, 
  onChange, 
  onCursorPositionChange
}) => {
  const [grammar, setGrammar] = useState(languages.javascript);

  useEffect(() => {
    // Map editor language to Prism language
    switch (language) {
      case 'javascript':
        setGrammar(languages.javascript);
        break;
      case 'python':
        setGrammar(languages.python);
        break;
      case 'java':
        setGrammar(languages.java);
        break;
      case 'csharp':
        setGrammar(languages.csharp);
        break;
      case 'cpp':
        setGrammar(languages.cpp);
        break;
      case 'html':
        setGrammar(languages.markup);
        break;
      case 'css':
        setGrammar(languages.css);
        break;
      default:
        setGrammar(languages.javascript);
    }
  }, [language]);

  const handleClick = (e) => {
    if (onCursorPositionChange) {
      // Get cursor position
      const cursorPosition = e.target.selectionStart;
      onCursorPositionChange(cursorPosition);
    }
  };

  const handleKeyUp = (e) => {
    if (onCursorPositionChange) {
      // Get cursor position
      const cursorPosition = e.target.selectionStart;
      onCursorPositionChange(cursorPosition);
    }
  };

  return (
    <div className="code-highlighter">
      <Editor
        value={code}
        onValueChange={onChange}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        highlight={code => highlight(code, grammar, language)}
        padding={16}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: '#2d2d2d',
          color: '#ccc',
          height: '100%',
          width: '100%',
          minHeight: '400px',
          borderRadius: 0,
        }}
        className="editor-textarea"
      />
    </div>
  );
};

export default CodeHighlighter; 
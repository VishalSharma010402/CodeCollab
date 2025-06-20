import { useState, useRef, useEffect } from 'react';
import '../styles/Terminal.css';

const Terminal = ({ code, language }) => {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const terminalRef = useRef(null);

  const runCode = async () => {
    setIsRunning(true);
    setError('');
    
    try {
      // Clear previous output
      setOutput('');
      
      // Try server-side execution first for supported languages
      if (['python', 'javascript', 'java'].includes(language)) {
        try {
          const response = await fetch('https://codecollab-cze2.onrender.com/api/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, language }),
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setOutput(result.output || 'Code executed successfully!');
            } else {
              setError(result.output);
              setOutput(`Execution failed: ${result.output}`);
            }
            setIsRunning(false);
            return;
          }
        } catch (fetchError) {
          console.log('Server-side execution failed, falling back to client-side simulation');
        }
      }
      
      // Fallback to client-side simulation
      setTimeout(() => {
        let result = '';
        
        switch (language) {
          case 'javascript':
            try {
              // Create a safe environment for evaluation
              const consoleOutput = [];
              const mockConsole = {
                log: (...args) => {
                  consoleOutput.push(args.map(arg => {
                    if (typeof arg === 'object') {
                      return JSON.stringify(arg, null, 2);
                    }
                    return String(arg);
                  }).join(' '));
                },
                error: (...args) => {
                  consoleOutput.push(`Error: ${args.map(arg => String(arg)).join(' ')}`);
                },
                warn: (...args) => {
                  consoleOutput.push(`Warning: ${args.map(arg => String(arg)).join(' ')}`);
                },
                info: (...args) => {
                  consoleOutput.push(`Info: ${args.map(arg => String(arg)).join(' ')}`);
                }
              };
              
              // Create a sandbox function with mocked console and basic APIs
              const sandbox = new Function('console', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'JSON', `
                try {
                  ${code}
                  return { success: true, output: null };
                } catch (error) {
                  return { success: false, error: error.message };
                }
              `);
              
              // Run the code in the sandbox
              const result = sandbox(mockConsole, Math, Date, Array, Object, String, Number, Boolean, JSON);
              
              if (result.success) {
                setOutput(consoleOutput.join('\n'));
              } else {
                setError(result.error);
                setOutput(`Execution failed: ${result.error}`);
              }
            } catch (e) {
              setError(e.message);
              setOutput(`Execution failed: ${e.message}`);
            }
            break;
            
          case 'python':
            // Simulate Python execution
            result = '# Python Code Execution (Simulation)\n';
            result += '# For real execution, ensure Python is installed on the server\n\n';
            
            // Basic Python syntax parsing
            if (code.includes('print(')) {
              const printMatches = code.match(/print\(['"`](.*?)['"`]\)/g);
              if (printMatches) {
                printMatches.forEach(match => {
                  const content = match.match(/print\(['"`](.*?)['"`]\)/);
                  if (content && content[1]) {
                    result += `${content[1]}\n`;
                  }
                });
              }
            }
            
            // Check for common Python patterns
            if (code.includes('def ')) {
              result += '# Function definitions detected\n';
            }
            if (code.includes('import ')) {
              result += '# Import statements detected\n';
            }
            if (code.includes('if __name__')) {
              result += '# Main block detected\n';
            }
            
            setOutput(result);
            break;
            
          case 'java':
            result = '// Java Code Execution (Simulation)\n';
            result += '// For real execution, ensure Java is installed on the server\n\n';
            
            if (code.includes('public class')) {
              result += '# Class definition detected\n';
            }
            if (code.includes('public static void main')) {
              result += '# Main method detected\n';
            }
            if (code.includes('System.out.println')) {
              const printMatches = code.match(/System\.out\.println\(['"`](.*?)['"`]\)/g);
              if (printMatches) {
                printMatches.forEach(match => {
                  const content = match.match(/System\.out\.println\(['"`](.*?)['"`]\)/);
                  if (content && content[1]) {
                    result += `${content[1]}\n`;
                  }
                });
              }
            }
            
            setOutput(result);
            break;
            
          case 'cpp':
            result = '// C++ Code Execution (Simulation)\n';
            result += '// For real execution, ensure C++ compiler is installed on the server\n\n';
            
            if (code.includes('#include')) {
              result += '# Include statements detected\n';
            }
            if (code.includes('int main()')) {
              result += '# Main function detected\n';
            }
            if (code.includes('cout <<')) {
              const coutMatches = code.match(/cout\s*<<\s*['"`](.*?)['"`]/g);
              if (coutMatches) {
                coutMatches.forEach(match => {
                  const content = match.match(/cout\s*<<\s*['"`](.*?)['"`]/);
                  if (content && content[1]) {
                    result += `${content[1]}\n`;
                  }
                });
              }
            }
            
            setOutput(result);
            break;
            
          case 'html':
            result = '<!-- HTML Preview -->\n';
            result += '<!-- This would render the HTML in an iframe -->\n\n';
            result += 'HTML Structure:\n';
            
            // Basic HTML parsing
            const tags = code.match(/<(\w+)[^>]*>/g);
            if (tags) {
              tags.forEach(tag => {
                const tagName = tag.match(/<(\w+)/);
                if (tagName) {
                  result += `- ${tagName[1]} tag\n`;
                }
              });
            }
            
            setOutput(result);
            break;
            
          case 'css':
            result = '/* CSS Styles */\n';
            result += '/* This would apply styles to a preview element */\n\n';
            
            // Basic CSS parsing
            const selectors = code.match(/([.#]?\w+)\s*{/g);
            if (selectors) {
              result += 'Detected selectors:\n';
              selectors.forEach(selector => {
                const cleanSelector = selector.replace(/\s*{/, '');
                result += `- ${cleanSelector}\n`;
              });
            }
            
            setOutput(result);
            break;
            
          default:
            setOutput(`Code execution for ${language} is not implemented in this demo.\nThis would require server-side integration for actual execution.`);
        }
        
        setIsRunning(false);
      }, 800); // Simulate execution time
      
    } catch (e) {
      setError(e.message);
      setOutput(`Execution failed: ${e.message}`);
      setIsRunning(false);
    }
  };
  
  const clearTerminal = () => {
    setOutput('');
    setError('');
    setInput('');
  };
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setOutput(prev => prev + '\n> ' + input);
      setInput('');
    }
  };
  
  // Scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <h3>Terminal Output</h3>
        <div className="terminal-actions">
          <button 
            className="run-btn"
            onClick={runCode}
            disabled={isRunning || !code.trim()}
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button 
            className="clear-btn"
            onClick={clearTerminal}
            disabled={!output && !error}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div 
        className={`terminal-output ${error ? 'has-error' : ''}`}
        ref={terminalRef}
      >
        {output ? (
          <pre>{output}</pre>
        ) : (
          <div className="terminal-placeholder">
            {isRunning ? 'Running code...' : 'Run your code to see output here'}
          </div>
        )}
      </div>
      
      <form onSubmit={handleInputSubmit} className="terminal-input-form">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Enter input (if needed)..."
          className="terminal-input"
          disabled={isRunning}
        />
        <button type="submit" className="input-submit-btn" disabled={isRunning || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Terminal; 
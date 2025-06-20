import { useState } from 'react'
import './App.css'
import JoinRoom from './components/JoinRoom'
import CodeEditor from './components/CodeEditor'

function App() {
  const [room, setRoom] = useState('');
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoinRoom = (roomData) => {
    setRoom(roomData.room);
    setUsername(roomData.username);
    setJoined(true);
  };

  return (
    <div className={`app-container ${joined ? 'in-editor' : ''}`}>
      {!joined ? (
        <>
          <h1 className='app-title'>CodeCollab</h1>

          <p className="description">A collaborative code editor</p>
          <JoinRoom onJoin={handleJoinRoom} />
        </>
      ) : (
        <CodeEditor 
          room={room} 
          username={username}
        />
      )}
    </div>
  );
}

export default App

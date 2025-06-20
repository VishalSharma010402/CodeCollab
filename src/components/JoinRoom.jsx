import { useState } from 'react';
import '../styles/JoinRoom.css';

const JoinRoom = ({ onJoin }) => {
  const [roomInput, setRoomInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!roomInput.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    if (!usernameInput.trim()) {
      setError('Please enter a username');
      return;
    }
    
    setError('');
    onJoin({ room: roomInput, username: usernameInput });
  };

  return (
    <div className="join-container">
      <form onSubmit={handleSubmit} className="join-form">
        <h2>Join a Collaboration Room</h2>
        
        <div className="form-group">
          <label htmlFor="room">Room ID</label>
          <input
            id="room"
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Enter room ID or create a new one"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="join-button">
          Join Room
        </button>
      </form>
    </div>
  );
};

export default JoinRoom; 
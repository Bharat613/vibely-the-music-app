// client/src/components/MiniPlayer.jsx

import React from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

const MiniPlayer = ({ currentSong, isPlaying, playSong, pauseSong, setActiveView }) => {
  if (!currentSong) return null;

  return (
    <div className="mini-player-container">
      <div className="mini-player-song-info" onClick={() => setActiveView("player")}>
        <img src={currentSong.image} alt={currentSong.title} className="mini-player-image" />
        <div className="mini-player-text">
          <h4>{currentSong.title}</h4>
          <p>{currentSong.artist}</p>
          {/* --- NEW: Display Album Name --- */}
          <p className="mini-player-album">{currentSong.album}</p>
        </div>
      </div>
      <div className="mini-player-controls">
        <button onClick={isPlaying ? pauseSong : playSong} className="mini-player-button">
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;
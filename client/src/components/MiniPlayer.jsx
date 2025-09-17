// client/src/components/MiniPlayer.jsx

import React from 'react';
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from 'react-icons/fa';

const MiniPlayer = ({ currentSong, isPlaying, playSong, pauseSong, nextSong, prevSong, setActiveView }) => {
  if (!currentSong) return null;

  return (
    <div className="mini-player-container">
      <div className="mini-player-song-info" onClick={() => setActiveView("player")}>
        <img src={currentSong.image} alt={currentSong.title} className="mini-player-image" />
        <div className="mini-player-text">
          <h4>{currentSong.title}</h4>
          <p>{currentSong.artist}</p>
          <p className="mini-player-album">{currentSong.album}</p>
        </div>
      </div>
      <div className="mini-player-controls">
        <button onClick={prevSong} className="mini-player-button">
          <FaStepBackward />
        </button>
        <button onClick={isPlaying ? pauseSong : playSong} className="mini-player-button">
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button onClick={nextSong} className="mini-player-button">
          <FaStepForward />
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;
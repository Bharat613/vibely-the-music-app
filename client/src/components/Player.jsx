// client/src/components/Player.jsx

import React from "react";
// ADDED FaShareAlt to the imports
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaHome, FaHeart, FaShareAlt } from "react-icons/fa";

const Player = ({
  audioRef,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  progressPercentage,
  handleTimeChange,
  playSong,
  pauseSong,
  prevSong,
  nextSong,
  handleSongEnd,
  updateTime,
  onAddToListClick,
  onAddToLikedSongsClick,
  onShareClick, // ADDED: New prop for the share function
  setActiveView,
  showHomeButton,
}) => {
  
  return (
    <div className="player-container">
      {showHomeButton && (
        <button className="player-home-button" onClick={() => setActiveView("home")}>
          <FaHome />
        </button>
      )}
      <div className="player-content">
        <img src={currentSong?.image || "/veebly.png"} alt="Album Art" className="player-album-image" />
        {/* ADDED SHARE AND LIKE BUTTONS WRAPPER */}
        <div className="player-top-buttons">
          {/* UPDATED: Changed class to 'share-button' for clarity */}
          <button 
            onClick={() => onShareClick(currentSong)} 
            className="player-button share-button"
            title="Share Song"
          >
            <FaShareAlt size={20} />
          </button>
          {/* UPDATED: Changed class to 'like-button' for clarity */}
          <button 
            onClick={() => onAddToLikedSongsClick(currentSong)} 
            className="player-button like-button"
            title="Add to Liked Songs"
          >
            <FaHeart size={20} />
          </button>
        </div>
        
        <div className="player-info">
          <h2 className="player-song-title">{currentSong?.title}</h2>
          <h3 className="player-song-artist">{currentSong?.movie}</h3>
          <p className="player-song-album">{currentSong?.album}</p>
        </div>
        
        <div className="controls-container">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleTimeChange}
            className="seek-slider"
            style={{ background: `linear-gradient(to right, var(--accent-color) ${progressPercentage}%, #3e3e3e ${progressPercentage}%)` }}
          />
          <div className="time-display">
            <span>{Math.floor(currentTime / 60)}:{("0" + Math.floor(currentTime % 60)).slice(-2)}</span>
            <span>{Math.floor(duration / 60)}:{("0" + Math.floor(duration % 60)).slice(-2)}</span>
          </div>
          <div className="player-buttons">
            <button onClick={prevSong} className="player-button">
              <FaStepBackward />
            </button>
            <button onClick={isPlaying ? pauseSong : playSong} className="player-button play-pause">
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={nextSong} className="player-button">
              <FaStepForward />
            </button>
          </div>
        </div>
        <button onClick={onAddToListClick} className="add-to-list-btn">
          Add to List
        </button>
      </div>
    </div>
  );
};

export default Player;
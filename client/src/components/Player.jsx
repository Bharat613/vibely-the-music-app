// client/src/components/Player.jsx

import React, { useEffect } from "react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaHome, FaHeart, FaShareAlt } from "react-icons/fa";
// Import useNavigate
import { useNavigate } from "react-router-dom";

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
  onShareClick,
  showHomeButton,
}) => {
  // Get the navigate function from React Router
  const navigate = useNavigate();

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong?.title || "Unknown Title",
        artist: currentSong?.movie || "Unknown Artist",
        album: currentSong?.album || "Unknown Album",
        artwork: [
          { src: currentSong?.image || "/veebly.png", sizes: "96x96", type: "image/png" },
          { src: currentSong?.image || "/veebly.png", sizes: "128x128", type: "image/png" },
          { src: currentSong?.image || "/veebly.png", sizes: "192x192", type: "image/png" },
          { src: currentSong?.image || "/veebly.png", sizes: "256x256", type: "image/png" },
          { src: currentSong?.image || "/veebly.png", sizes: "384x384", type: "image/png" },
          { src: currentSong?.image || "/veebly.png", sizes: "512x512", type: "image/png" },
        ],
      });
      
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        playSong();
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        pauseSong();
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        nextSong();
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        prevSong();
      });

      navigator.mediaSession.setActionHandler("seekbackward", (event) => {
        const skipTime = event.seekOffset || 10;
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
      });

      navigator.mediaSession.setActionHandler("seekforward", (event) => {
        const skipTime = event.seekOffset || 10;
        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + skipTime, audioRef.current.duration);
      });
    }
  }, [playSong, pauseSong, nextSong, prevSong, audioRef]);
  
  return (
    <div className="player-container">
      {showHomeButton && (
        <button className="player-home-button" onClick={() => navigate("/")}>
          <FaHome />
        </button>
      )}
      <div className="player-content">
        <img src={currentSong?.image || "/veebly.png"} alt="Album Art" className="player-album-image" />
        <div className="player-top-buttons">
          <button 
            onClick={() => onShareClick(currentSong)} 
            className="player-button share-button"
            title="Share Song"
          >
            <FaShareAlt size={20} />
          </button>
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
// client/src/components/Player.jsx

import React, { useEffect, useState } from "react";
import { FaBluetooth } from "react-icons/fa";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaHome,
  FaHeart,
  FaShareAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Player.css";

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
  relatedSuggestions,
  playSongFromSuggestion,
}) => {
  const navigate = useNavigate();
  const [deviceName, setDeviceName] = useState("This Device");

  // Try to detect connected audio output device
  // Try to detect connected audio output device
// useEffect(() => {
//   async function detectDevice() {
//     try {
//       if (navigator.mediaDevices?.enumerateDevices) {
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         const outputs = devices.filter((d) => d.kind === "audiooutput");

//         if (outputs.length > 0) {
//           // Use label if available, fallback to generic name
//           const fullName = outputs[0].label || "This Device";

//           // Optional: Extract text inside parentheses if present
//           const match = fullName.match(/\(([^)]+)\)/);
//           setDeviceName(match ? match[1] : fullName);
//         } else {
//           setDeviceName("This Device");
//         }
//       }
//     } catch (err) {
//       console.warn("Could not detect audio output device:", err);
//       setDeviceName("This Device");
//     }
//   }

//   detectDevice();
// }, []);
useEffect(() => {
  async function detectDevice() {
    let currentDeviceName = "This Device";

    try {
      if (navigator.mediaDevices?.enumerateDevices) {

        // Optional: request microphone permission (triggers prompt)
        // await navigator.mediaDevices.getUserMedia({ audio: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === "audiooutput");

        if (outputs.length > 0) {
          const rawLabel = outputs[0].label || outputs[0].deviceId;

          if (rawLabel && rawLabel !== "default") {
            // Best-effort parsing
            const match = rawLabel.match(/\(([^)]+)\)/);
            currentDeviceName = match?.[1] || rawLabel;
          } else if (rawLabel.toLowerCase().includes("bluetooth")) {
            currentDeviceName = "Bluetooth Headset";
          } else {
            currentDeviceName = "This Device";
          }
        }
      }
    } catch (err) {
      console.warn("Could not detect audio output device:", err);
    }

    setDeviceName(currentDeviceName);
  }

  detectDevice();
}, []);



  // Update Media Session Metadata
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong?.title || "Unknown Title",
        artist: currentSong?.artist || "Unknown Artist",
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

  // Media Session Controls
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", playSong);
      navigator.mediaSession.setActionHandler("pause", pauseSong);
      navigator.mediaSession.setActionHandler("nexttrack", nextSong);
      navigator.mediaSession.setActionHandler("previoustrack", prevSong);

      navigator.mediaSession.setActionHandler("seekbackward", (event) => {
        const skipTime = event.seekOffset || 10;
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
      });

      navigator.mediaSession.setActionHandler("seekforward", (event) => {
        const skipTime = event.seekOffset || 10;
        audioRef.current.currentTime = Math.min(
          audioRef.current.currentTime + skipTime,
          audioRef.current.duration
        );
      });
    }
  }, [playSong, pauseSong, nextSong, prevSong, audioRef]);

  return (
    <div className="player-container">
      {/* Home Button */}
      {showHomeButton && (
        <button className="player-home-button" onClick={() => navigate("/")}>
          <FaHome />
        </button>
      )}

      {/* Player Content */}
      <div className="player-content">
        <img
          src={currentSong?.image || "/veebly.png"}
          alt="Album Art"
          className="player-album-image"
        />

        {/* Top Buttons */}
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

        {/* Song Info */}
        <div className="player-info">
          <h2 className="player-song-title">{currentSong?.title}</h2>
          <h3 className="player-song-artist">{currentSong?.artist}</h3>
          <p className="player-song-album">{currentSong?.album}</p>

          {/* 👇 Show detected device name */}
          {deviceName && (
  <p className="player-device-name">
    <FaBluetooth style={{ marginRight: "5px", color: "#08d72eff" }} />
    <strong>{deviceName}</strong>
  </p>
)}

        </div>

        {/* Controls */}
        <div className="controls-container">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleTimeChange}
            className="seek-slider"
            style={{
              background: `linear-gradient(to right, var(--accent-color) ${progressPercentage}%, #3e3e3e ${progressPercentage}%)`,
            }}
          />
          <div className="time-display">
            <span>
              {Math.floor(currentTime / 60)}:
              {("0" + Math.floor(currentTime % 60)).slice(-2)}
            </span>
            <span>
              {Math.floor(duration / 60)}:
              {("0" + Math.floor(duration % 60)).slice(-2)}
            </span>
          </div>

          <div className="player-buttons">
            <button onClick={prevSong} className="player-button">
              <FaStepBackward />
            </button>
            <button
              onClick={isPlaying ? pauseSong : playSong}
              className="player-button play-pause"
            >
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

      {/* Related Suggestions */}
      {relatedSuggestions.length > 0 && (
        <div className="related-songs-container">
          <h4 className="related-songs-title">You might also like</h4>
          <div className="suggestions-list">
            {relatedSuggestions.map((song, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => playSongFromSuggestion(song)}
              >
                <img
                  src={song.image || "/veebly.png"}
                  alt="Album Art"
                  className="suggestion-image"
                />
                <div className="suggestion-info">
                  <h5 className="suggestion-title">{song.title}</h5>
                  <p className="suggestion-artist">{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;

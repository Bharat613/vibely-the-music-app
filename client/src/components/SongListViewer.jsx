import React from 'react';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './SongListViewer.css';

const SongListViewer = ({ list, playSongFromList, onDeleteSong, isUserPlaylist }) => {
  const navigate = useNavigate();

  if (!list || !list.songs || list.songs.length === 0) {
    return (
      <div className="song-list-viewer-container no-list">
        <button className="back-button" onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <p className="no-list-text">This list is empty or could not be loaded.</p>
      </div>
    );
  }

  const handlePlaySong = (song, index) => {
    // Pass the entire song list and the selected song's index
    playSongFromList(list.songs, index);
  };

  return (
    <div className="song-list-viewer-container">
      <div className="song-list-viewer-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft size={24} />
        </button>
        <h2 className="section-title">{list.name}</h2>
      </div>
      
      <div className="songs-list-scrollable">
        <ul className="playlist-list">
          {list.songs.map((song, index) => (
            <li key={index} className="playlist-item">
              <div className="playlist-song-info" onClick={() => handlePlaySong(song, index)}>
                <img src={song.image || ''} alt={song.title || 'Song Image'} />
                <div className="playlist-info">
                  <h4>{song.title || 'Unknown Title'}</h4>
                  <p>{song.album || 'Unknown Artist'}</p>
                </div>
              </div>
              {isUserPlaylist && (
                <button
                  className="remove-song-button"
                  onClick={() => onDeleteSong(song)}
                >
                  <FaTrash />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SongListViewer;
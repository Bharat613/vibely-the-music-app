// client/src/components/SongListViewer.jsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SongListViewer.css'; // Make sure you have this CSS file

function SongListViewer({ featuredLists, playSongFromList }) {
  const { listId } = useParams();
  const navigate = useNavigate();

  // Key change #1: Defensive check for the featuredLists prop.
  // This prevents the "Cannot read properties of undefined (reading 'find')" error.
  if (!featuredLists || !Array.isArray(featuredLists) || featuredLists.length === 0) {
    return (
      <div className="loading-container">
        <p>Loading featured lists...</p>
      </div>
    );
  }

  // Key change #2: Find the correct featured list using the unique `id` property
  // that was created in App.jsx (using the createSlug function).
  const list = featuredLists.find(l => l.id === listId);

  if (!list) {
    return (
      <div className="no-playlist-container">
        <p>Featured list not found. Please go back to the home page.</p>
        <button onClick={() => navigate('/')} className="back-to-home-btn">Go to Home</button>
      </div>
    );
  }

  return (
    <div className="song-list-viewer-container">
      <button className="back-button" onClick={() => navigate("/")}><i className="fa-solid fa-backward"></i></button>
      <h2 className="section-title">{list.name}</h2>
      {list.songs.length > 0 ? (
        <ul className="song-list-grid">
          {list.songs.map((song, index) => (
            <li key={index} className="song-list-item" onClick={() => playSongFromList(list.songs, index)}>
              <img src={song.image} alt={song.title} className="song-image" />
              <div className="song-info">
                <h4>{song.title}</h4>
                <p>{song.artist}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No songs available for this list.</p>
      )}
    </div>
  );
}

export default SongListViewer;
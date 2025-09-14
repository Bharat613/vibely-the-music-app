// client/src/components/PlaylistSelector.jsx

import React, { useState } from "react";
import "./PlaylistSelector.css";

const PlaylistSelector = ({ playlists, onAddToList, onNewList, onClose }) => {
  const [newListName, setNewListName] = useState("");

  const handleCreateNewList = (e) => {
    e.preventDefault();
    if (newListName.trim()) {
      onNewList(newListName.trim());
      setNewListName("");
      onClose();
    }
  };

  return (
    <div className="playlist-selector-overlay">
      <div className="playlist-selector-modal">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h3 className="selector-title">Add to Playlist</h3>

        <form onSubmit={handleCreateNewList} className="new-list-form">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Create a new playlist"
          />
          <button type="submit">Create</button>
        </form>

        <div className="playlists-list-container">
          {playlists.map((playlist, index) => (
            <button
              key={index}
              className="playlist-item-button"
              onClick={() => {
                onAddToList(playlist.name);
                onClose();
              }}
            >
              {playlist.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistSelector;
// client/src/components/PlaylistSelector.jsx

import React, { useState } from "react";
import "./PlaylistSelector.css";

const PlaylistSelector = ({ playlists, onAddToList, onNewList, onClose }) => {
  const [newListName, setNewListName] = useState("");

  const handleCreateNewList = async (e) => {
    e.preventDefault();
    if (newListName.trim()) {
      const success = await onNewList(newListName.trim());
      if (success) {
        setNewListName("");
        onClose();
      }
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
              onClick={async () => {
                const success = await onAddToList(playlist.name);
                if (success) {
                  onClose();
                }
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
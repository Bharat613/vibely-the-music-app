// Home.jsx

import React from 'react';
import { FaHeart, FaTrash } from 'react-icons/fa';
import './Home.css';

const Home = ({ recentSongs, playlists, playFromList, onPlaylistClick, onDeletePlaylist, trendingSongs }) => {
  const likedSongs = playlists.find(p => p.name === "Liked Songs");
  const otherPlaylists = playlists.filter(p => p.name !== "Liked Songs");

  return (
    <div className="home-screen">
      {/* Trending Songs Section */}
      {trendingSongs && trendingSongs.length > 0 && (
        <div className="section">
          <h2 className="section-title">Trending Songs</h2>
          <div className="song-list">
            {trendingSongs.map((song, index) => (
              <div key={`trending-${index}`} className="song-item" onClick={() => playFromList(song)}>
                <img src={song.image} alt={song.title} />
                <h4>{song.title}</h4>
                <p>{song.movie}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Played Section */}
      {recentSongs && recentSongs.length > 0 && (
        <div className="section">
          <h2 className="section-title">Recently Played</h2>
          <div className="song-list">
            {recentSongs.map((song, index) => (
              <div key={`recent-${index}`} className="song-item" onClick={() => playFromList(song)}>
                <img src={song.image} alt={song.title} />
                <h4>{song.title}</h4>
                <p>{song.artist}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Playlists Section */}
      <div className="section">
        <h2 className="section-title">Your Playlists</h2>
        <div className="playlist-list-container">
          {/* Liked Songs Card */}
          {likedSongs && (
            <div className="playlist-card" onClick={() => onPlaylistClick(likedSongs)}>
              <div className="playlist-card-image">
                <FaHeart size={48} color="#fff" />
              </div>
              <div className="playlist-card-info">
                <h4>Liked Songs</h4>
                <p>{likedSongs.songs.length} songs</p>
              </div>
            </div>
          )}

          {/* Dynamically Created Playlists */}
          {otherPlaylists.map((playlist, index) => (
            <div key={index} className="playlist-card">
              <div
                className="playlist-card-image"
                onClick={() => onPlaylistClick(playlist)}
              >
                {playlist.songs.length > 0 ? (
                  <img src={playlist.songs[0].image} alt={playlist.name} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3a9 9 0 019 9c0 4.97-4.03 9-9 9s-9-4.03-9-9a9 9 0 019-9zm0 2a7 7 0 100 14A7 7 0 0012 5zm0 2a5 5 0 110 10A5 5 0 0112 7zm0 2a3 3 0 100 6 3 3 0 000-6zm0 2a1 1 0 110 2 1 1 0 010-2z"/>
                  </svg>
                )}
              </div>
              <div className="playlist-card-info">
                <h4>{playlist.name}</h4>
                <p>{playlist.songs.length} songs</p>
              </div>

              {/* Delete Button */}
              <button
                className="delete-btn"
                onClick={() => onDeletePlaylist(playlist)}
              >
                <FaTrash size={14} />
              </button>
            </div>
          ))}
        </div>
        {playlists.length === 0 && (
          <p>You have no playlists yet. Add a song from the player to create one!</p>
        )}
      </div>
    </div>
  );
};

export default Home;
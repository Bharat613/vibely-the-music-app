import React from 'react';
import { FaHeart, FaTrash, FaPlus, FaPlay } from 'react-icons/fa';
import './Home.css';

const Home = ({ recentSongs, playlists, playFromList, onPlaylistClick, onDeletePlaylist, trendingSongs, newReleases, onCreatePlaylistClick }) => {
  const likedSongs = playlists.find(p => p.name === "Liked Songs");
  const otherPlaylists = playlists.filter(p => p.name !== "Liked Songs");
  const limitedRecentSongs = recentSongs.slice(0, 8);

  return (
    <div className="home-screen">

      {/* New Releases Section */}
      {newReleases && newReleases.length > 0 && (
        <div className="section">
          <h2 className="section-title">New Releases</h2>
          <div className="song-list">
            {newReleases.map((song, index) => (
              // FIX: Add a check for a valid song object
              song && (
                <div key={`new-release-${index}`} className="song-item" onClick={() => playFromList(song)}>
                  <img src={song.image} alt={song.title} />
                  <h4>{song.title}</h4>
                  <p>{song.artist}</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Trending Songs Section */}
      {trendingSongs && trendingSongs.length > 0 && (
        <div className="section">
          <h2 className="section-title">Trending Songs</h2>
          <div className="song-list">
            {trendingSongs.map((song, index) => (
              // FIX: Add a check for a valid song object
              song && (
                <div key={`trending-${index}`} className="song-item" onClick={() => playFromList(song)}>
                  <img src={song.image} alt={song.title} />
                  <h4>{song.title}</h4>
                  <p>{song.movie}</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Recently Played Section */}
      {limitedRecentSongs.length > 0 && (
        <div className="section">
          <h2 className="section-title">Recently Played</h2>
          <div className="song-list">
            {limitedRecentSongs.map((song, index) => (
              // FIX: Add a check for a valid song object
              song && (
                <div key={`recent-${index}`} className="song-item" onClick={() => playFromList(song)}>
                  <img src={song.image} alt={song.title} />
                  <h4>{song.title}</h4>
                  <p>{song.artist}</p>
                </div>
              )
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
                {playlist.songs.length > 0 && playlist.songs[0] ? (
                  <img src={playlist.songs[0].image} alt={playlist.name} />
                ) : (
                  <FaPlay size={48} color="#fff" />
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

          {/* New Playlist Card */}
          <div className="playlist-card add-playlist-card" onClick={onCreatePlaylistClick}>
            <div className="playlist-card-image">
              <FaPlus size={48} color="#fff" />
            </div>
            <div className="playlist-card-info">
              <h4>Create Playlist</h4>
            </div>
          </div>
        </div>

        {playlists.length === 0 && (
          <p>You have no playlists yet. Add a song from the player to create one!</p>
        )}
      </div>
    </div>
  );
};

export default Home;
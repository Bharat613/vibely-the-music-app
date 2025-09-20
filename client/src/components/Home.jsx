import React from 'react';
import { FaHeart, FaTrash, FaPlus, FaPlay } from 'react-icons/fa';
import './Home.css';

// Reusable component for rendering song lists
const SongSection = ({ title, songs, playFromList }) => {
  if (!songs || !Array.isArray(songs) || songs.length === 0) {
    return null;
  }

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      <div className="song-list">
        {songs.map((song, index) => (
          song && (
            <div key={`song-${title}-${index}`} className="song-item" onClick={() => playFromList(song)}>
              <img src={song.image || ''} alt={song.title || 'Song Image'} />
              <h4>{song.title || 'Unknown Title'}</h4>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

const Home = ({
  recentSongs,
  playlists,
  playFromList,
  onPlaylistClick,
  onDeletePlaylist,
  trendingSongs,
  onCreatePlaylistClick,
  featuredLists,
  onFeaturedListClick,
  famousSingers,
  onSingerClick,
  famousMusicDirectors,
  onDirectorClick,
}) => {
  const safePlaylists = playlists || [];
  const safeFeaturedLists = featuredLists || [];
  const safeFamousSingers = famousSingers || [];
  const safeFamousMusicDirectors = famousMusicDirectors || [];

  const likedSongs = safePlaylists.find(p => p.name === "Liked Songs");
  const otherPlaylists = safePlaylists.filter(p => p.name !== "Liked Songs");
  const limitedRecentSongs = recentSongs ? recentSongs.slice(0, 11) : [];

  return (
    <div className="home-layout">
      {/* Main content area on the right, appears first on mobile */}
      <div className="main-content-column">
        <SongSection
          title="Trending Songs"
          songs={trendingSongs}
          playFromList={playFromList}
        />
        {safeFeaturedLists.length > 0 && (
          <div className="section featured-lists-section">
            <h2 className="section-title">Featured Lists</h2>
            <div className="song-list">
              {safeFeaturedLists.map((playlist, index) => (
                playlist && (
                  <div
                    key={`featured-list-${index}`}
                    className="song-item"
                    onClick={() => onFeaturedListClick(playlist)}
                  >
                    <img src={playlist.image || ''} alt={playlist.name || 'Featured List'} />
                    <h4>{playlist.name || 'Untitled List'}</h4>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {safeFamousMusicDirectors.length > 0 && (
          <div className="section famous-singers-section">
            <h2 className="section-title">Famous Music Directors</h2>
            <div className="song-list">
              {safeFamousMusicDirectors.map((director, index) => (
                director && (
                  <div
                    key={`director-${index}`}
                    className="song-item"
                    onClick={() => onDirectorClick(director)}
                  >
                    <img src={director.image || '/images/default-director-art.png'} alt={director.name || 'Director Image'} />
                    <h4>{director.name || 'Unknown Director'}</h4>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {safeFamousSingers.length > 0 && (
          <div className="section famous-singers-section">
            <h2 className="section-title">Famous Singers</h2>
            <div className="song-list">
              {safeFamousSingers.map((singer, index) => (
                singer && (
                  <div
                    key={`singer-${index}`}
                    className="song-item"
                    onClick={() => onSingerClick(singer)}
                  >
                    <img src={singer.image || '/images/default-singer-art.png'} alt={singer.name || 'Singer Image'} />
                    <h4>{singer.name || 'Unknown Singer'}</h4>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        <SongSection
          title="Recently Played"
          songs={limitedRecentSongs}
          playFromList={playFromList}
        />
      </div>

      {/* "Your Playlists" section, appears last on mobile and first on desktop */}
      <div className="playlists-column">
        <div className="section">
          <h2 className="section-title">Your Playlists</h2>
          <div className="playlist-list-container">
            {likedSongs && (
              <div className="playlist-card" onClick={() => onPlaylistClick(likedSongs)}>
                <div className="playlist-card-image">
                  <FaHeart size={48} color="#fff" />
                </div>
                <div className="playlist-card-info">
                  <h4>Liked Songs</h4>
                  <p>{likedSongs.songs?.length || 0} songs</p>
                </div>
              </div>
            )}

            {otherPlaylists.map((playlist, index) => (
              playlist && (
                <div key={index} className="playlist-card" onClick={() => onPlaylistClick(playlist)}>
                  <div className="playlist-card-image" >
                    {playlist.songs && playlist.songs.length > 0 && playlist.songs[0] ? (
                      <img src={playlist.songs[0].image || ''} alt={playlist.name || 'Playlist Image'} />
                    ) : (
                      <FaPlay size={48} color="#fff" />
                    )}
                  </div>
                  <div className="playlist-card-info">
                    <h4>{playlist.name || 'Untitled Playlist'}</h4>
                    <p>{playlist.songs?.length || 0} songs</p>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlaylist(playlist);
                    }}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              )
            ))}

            <div className="playlist-card add-playlist-card" onClick={onCreatePlaylistClick}>
              <div className="playlist-card-image">
                <FaPlus size={48} color="#fff" />
              </div>
              <div className="playlist-card-info">
                <h4>Create Playlist</h4>
              </div>
            </div>
          </div>
          {safePlaylists.length === 0 && (
            <p>You have no playlists yet. Add a song from the player to create one!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
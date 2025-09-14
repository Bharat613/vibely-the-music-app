import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { FaSearch, FaTrash } from "react-icons/fa";
import Auth from "./components/Auth";
import Home from "./components/Home";
import Player from "./components/Player";
import MiniPlayer from "./components/MiniPlayer";
import PlaylistSelector from "./components/PlaylistSelector";

const SAAVN_API_URL = import.meta.env.VITE_SAAVN_API_URL;
const ITUNES_API_URL = import.meta.env.VITE_ITUNES_API_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [songName, setSongName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [songList, setSongList] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookies.get("userToken"));
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [playlists, setPlaylists] = useState([]);
  const [activeView, setActiveView] = useState("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

  const audioRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Hardcoded Trending Songs Data
  // client/src/App.js

// ... other imports and state variables ...

// Updated Hardcoded Trending Songs Data with URLs from .env
const trendingSongs = [
  {
    title: 'Kurchi Madathapetti',
    movie: 'Guntur Kaaram',
    image: 'https://upload.wikimedia.org/wikipedia/en/5/5e/Kurchi_Madathapetti.jpg',
    url: import.meta.env.VITE_SONG_URL_KURCHI,
  },
  {
    title: 'Nijame Ne Chebutunna',
    movie: 'Ooru Peru Bhairavakona',
    image: 'https://i.scdn.co/image/ab67616d0000b2731e5af7c5265c7ce91982b418',
    url: import.meta.env.VITE_SONG_URL_NIJAME,
  },
  {
    title: 'Samayama',
    movie: 'Hi Nanna',
    image: 'https://c.saavncdn.com/307/Samayama-From-Hi-Nanna-Telugu-2023-20230918164922-500x500.jpg',
    url: import.meta.env.VITE_SONG_URL_SAMAYAMA,
  },
  {
    title: 'Pushpa Pushpa',
    movie: 'Pushpa 2: The Rule',
    image: 'https://c.saavncdn.com/601/Pushpa-Pushpa-From-Pushpa-2-The-Rule-Telugu-Telugu-2024-20240501161044-500x500.jpg',
    url: import.meta.env.VITE_SONG_URL_PUSHPA,
  },
  {
    title: 'Koyila',
    movie: '',
    image: 'https://c.saavncdn.com/957/Koyila-Telugu-2025-20250522020441-500x500.jpg',
    url: import.meta.env.VITE_SONG_URL_KOYILA,
  },
];

  useEffect(() => {
    const user = Cookies.get("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      fetchPlaylists(parsedUser.email);
      fetchRecentlyPlayedSongs(parsedUser.email);
    }
  }, [isLoggedIn]);
  
  // NEW: This effect handles clicks outside the search suggestions
  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Check if the click is outside the search container
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSuggestions([]); // Hide the suggestions by clearing the list
      }
    };

    // Add the event listener to the document
    document.addEventListener('mousedown', handleOutsideClick);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []); // Empty dependency array ensures this runs only once

  const fetchRecentlyPlayedSongs = async (userEmail) => {
    try {
      const response = await fetch(`${BACKEND_URL}/recently-played/${userEmail}`);
      const data = await response.json();
      if (data.success) {
        setRecentlyPlayed(data.recentlyPlayed);
      } else {
        toast.error("Failed to fetch recently played songs: " + data.msg);
      }
    } catch (error) {
      console.error("Error fetching recently played songs:", error);
    }
  };

  const saveRecentlyPlayedSong = async (song, userEmail) => {
    if (!song || !userEmail) return;
    try {
      const response = await fetch(`${BACKEND_URL}/recently-played`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, song }),
      });
      const data = await response.json();
      if (data.success) {
        setRecentlyPlayed(data.recentlyPlayed);
      }
    } catch (error) {
      console.error("Error saving song to recently played:", error);
    }
  };

  useEffect(() => {
    if (songList.length > 0 && currentUser) {
      const currentSong = songList[currentSongIndex];
      saveRecentlyPlayedSong(currentSong, currentUser.email);
    }
  }, [currentSongIndex, songList, currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.msg);
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        Cookies.set("userToken", data.token, { expires: 7 });
        Cookies.set("user", JSON.stringify(data.user), { expires: 7 });
        fetchPlaylists(data.user.email);
        fetchRecentlyPlayedSongs(data.user.email);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      toast.error("Failed to connect to server. Please try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.msg);
        setIsLoginView(true);
        setEmail("");
        setPassword("");
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      toast.error("Failed to connect to server. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSongList([]);
    setPlaylists([]);
    Cookies.remove("userToken");
    Cookies.remove("user");
    setActiveView("home");
    setRecentlyPlayed([]);
  };

  const fetchPlaylists = async (userEmail) => {
    if (!userEmail) return;
    try {
      const response = await fetch(`${BACKEND_URL}/playlists/${userEmail}`);
      const data = await response.json();
      if (data.success) {
        setPlaylists(data.playlists);
      } else {
        toast.error("Failed to fetch playlists: " + data.msg);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const addSongToPlaylist = async (playlistName, song) => {
    if (!currentUser) {
      toast.error("Please log in to add songs to a playlist.");
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, playlistName, song }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.msg);
        fetchPlaylists(currentUser.email);
      } else {
        toast.error("Failed to add song: " + data.msg);
      }
    } catch (error) {
      console.error("Error adding to playlist:", error);
    }
  };

  const removeSongFromPlaylist = async (playlistName, songToRemove) => {
    if (!currentUser) {
      toast.error("Please log in to manage playlists.");
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/playlists`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          playlistName,
          song: songToRemove,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.msg);
        fetchPlaylists(currentUser.email);
      } else {
        toast.error("Failed to remove song: " + data.msg);
      }
    } catch (error) {
      console.error("Error removing from playlist:", error);
    }
  };

  const fetchSongImage = async (songTitle, artistName) => {
    try {
      const searchTerm = artistName ? `${songTitle} ${artistName}` : songTitle;
      const res = await fetch(`${ITUNES_API_URL}?term=${encodeURIComponent(searchTerm)}&entity=song&limit=1`);
      if (!res.ok) throw new Error(`iTunes API request failed: ${res.status}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].artworkUrl100.replace("100x100", "500x500");
      }
      return "/veebly.png";
    } catch (err) {
      console.error("iTunes fetch error:", err);
      return "/veebly.png";
    }
  };

  const fetchSong = async (name) => {
    try {
      const res = await fetch(`${SAAVN_API_URL}/search/songs?query=${encodeURIComponent(name)}&bitrate=320`);
      const data = await res.json();

      if (data.success && data.data?.results?.length > 0) {
        const songs = await Promise.all(
          data.data.results.map(async (song) => {
            const cleanedTitle = song.name.replace(/\s*\(.*?\)|\[.*?\]/g, "").trim();
            const img = await fetchSongImage(cleanedTitle, song.primaryArtists);
            return {
              title: cleanedTitle,
              artist: song.primaryArtists, 
              url: song.downloadUrl?.[2]?.url || song.downloadUrl?.[1]?.url || song.downloadUrl?.[0]?.url,
              image: img,
              album: song.album?.name || "Unknown Album",
            };
          })
        );
        setSongList(songs);
        setCurrentSongIndex(0);
        setSuggestions([]);
        setActiveView("player");
      } else {
        toast.error("❌ Song not found!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch songs. Please try again.");
    }
  };

  const playNewSong = async () => {
    if (audioRef.current && songList.length > 0) {
      audioRef.current.load();
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Autoplay was prevented:", error);
        setIsPlaying(false);
      }
    }
  };
  useEffect(() => {
    playNewSong();
  }, [currentSongIndex, songList]);

  const playSong = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  const nextSong = () => {
    if (currentSongIndex < songList.length - 1) {
      setCurrentSongIndex(prev => prev + 1);
    } else {
      setCurrentSongIndex(0);
    }
  };

  const prevSong = () => setCurrentSongIndex((prev) => (prev - 1 + songList.length) % songList.length);
  
  const handleSongEnd = () => {
    if (activeView === "playlist" && selectedPlaylist) {
      const currentPlaylist = playlists.find(p => p.name === selectedPlaylist.name);
      if (currentPlaylist && currentPlaylist.songs.length > 1) {
        const currentSongIndexInPlaylist = currentPlaylist.songs.findIndex(
          (song) => song.title === songList[currentSongIndex].title && song.artist === songList[currentSongIndex].artist
        );
        if (currentSongIndexInPlaylist !== -1 && currentSongIndexInPlaylist < currentPlaylist.songs.length - 1) {
          const nextSongInPlaylist = currentPlaylist.songs[currentSongIndexInPlaylist + 1];
          playFromList(nextSongInPlaylist);
        } else {
          toast.info("Playlist has ended. Enjoy some new tunes!");
          fetchSong("top songs 2025");
        }
      } else {
        toast.info("Playing a random song!");
        fetchSong("top songs 2025");
      }
    } else {
      setIsPlaying(false);
      if (songList.length > 1) {
        nextSong();
      }
    }
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSongName(value);
    if (value.length > 2) {
      try {
        const res = await fetch(`${SAAVN_API_URL}/search/songs?query=${encodeURIComponent(value)}&bitrate=320`);
        const data = await res.json();
        if (data.success && data.data?.results?.length > 0) {
          const suggs = data.data.results.slice(0, 5).map((s) => ({ title: s.name, artist: s.primaryArtists }));
          setSuggestions(suggs);
        }
      } catch (err) {
        console.error(err);
      }
    } else setSuggestions([]);
  };

  const handleTimeChange = (e) => {
    if (audioRef.current) {
      audioRef.current.currentTime = e.target.value;
      setCurrentTime(e.target.value);
    }
  };

  const updateTime = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const handleDeletePlaylist = async (playlistToDelete) => {
    if (!currentUser) {
      toast.error("Please log in to manage playlists.");
      return;
    }

    if (playlistToDelete.name === "Liked Songs") {
      toast.error("You cannot delete the Liked Songs playlist.");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/playlists/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          playlistName: playlistToDelete.name,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.msg);
        fetchPlaylists(currentUser.email);
      } else {
        toast.error("Failed to delete playlist: " + data.msg);
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };

  const playFromList = (song) => {
    const currentPlaylist = playlists.find(p => p.name === selectedPlaylist?.name);
    if (currentPlaylist) {
        const songIndex = currentPlaylist.songs.findIndex(
            (s) => s.title === song.title && s.artist === song.artist
        );
        if (songIndex !== -1) {
            setSongList(currentPlaylist.songs);
            setCurrentSongIndex(songIndex);
            setActiveView("player");
        } else {
            setSongList([song]);
            setCurrentSongIndex(0);
            setActiveView("player");
        }
    } else {
        setSongList([song]);
        setCurrentSongIndex(0);
        setActiveView("player");
    }
  };

  const handleAddToPlaylistClick = () => {
    if (!currentUser) {
        toast.error("Please log in to add songs to a playlist.");
        return;
    }
    setShowPlaylistSelector(true);
  };

  const handleAddSongToList = (playlistName) => {
    if (songList.length > 0) {
      addSongToPlaylist(playlistName, songList[currentSongIndex]);
    }
  };

  const handleCreateNewPlaylist = (newPlaylistName) => {
    if (songList.length > 0) {
      addSongToPlaylist(newPlaylistName, songList[currentSongIndex]);
    }
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <Auth
          isLoginView={isLoginView}
          setIsLoginView={setIsLoginView}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          handleLogin={handleLogin}
          handleSignup={handleSignup}
        />
      );
    }

    switch (activeView) {
      case "player":
        return songList.length > 0 ? (
          <Player
            audioRef={audioRef}
            currentSong={songList[currentSongIndex]}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            progressPercentage={progressPercentage}
            handleTimeChange={handleTimeChange}
            playSong={playSong}
            pauseSong={pauseSong}
            prevSong={prevSong}
            nextSong={nextSong}
            handleSongEnd={handleSongEnd}
            updateTime={updateTime}
            onAddToListClick={handleAddToPlaylistClick}
            setActiveView={setActiveView}
            showHomeButton={true}
          />
        ) : (
          <Home
            recentSongs={recentlyPlayed}
            playlists={playlists}
            playFromList={playFromList}
            onPlaylistClick={(playlist) => {
              setSelectedPlaylist(playlist);
              setActiveView("playlist");
            }}
            onDeletePlaylist={handleDeletePlaylist}
            trendingSongs={trendingSongs} // <--- Pass the trending songs here
          />
        );
      case "playlist":
        const currentPlaylist = playlists.find(p => p.name === selectedPlaylist.name);
        return (
          <div className="playlist-view">
            <button className="back-button" onClick={() => setActiveView("home")}>← Back to Home</button>
            <h2 className="section-title">{currentPlaylist?.name}</h2>
            <ul className="playlist-list">
              {currentPlaylist?.songs?.map((song, index) => (
                <li key={index} className="playlist-item">
                  <div className="playlist-song-info" onClick={() => {
                    playFromList(song);
                    const playlistSongs = playlists.find(p => p.name === selectedPlaylist.name)?.songs || [];
                    setSongList(playlistSongs);
                    setCurrentSongIndex(index);
                    setActiveView("player");
                  }}>
                    <img src={song.image} alt={song.title} />
                    <div className="playlist-info">
                      <h4>{song.title}</h4>
                      <p>{song.album}</p>
                    </div>
                  </div>
                  <button
                    className="remove-song-button"
                    onClick={() => removeSongFromPlaylist(currentPlaylist.name, song)}
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      default:
        return (
          <Home
            recentSongs={recentlyPlayed}
            playlists={playlists}
            playFromList={playFromList}
            onPlaylistClick={(playlist) => {
              setSelectedPlaylist(playlist);
              setActiveView("playlist");
            }}
            onDeletePlaylist={handleDeletePlaylist}
            trendingSongs={trendingSongs} // <--- Pass the trending songs here
          />
        );
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        draggable
        pauseOnHover
        className="vibely-toast-container"
        toastClassName="vibely-toast"
        progressClassName="vibely-progress"
      />
      <div className="app">
        {isLoggedIn && (
          <div className="top-bar">
            <div className="search-container" ref={searchContainerRef}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (songName) fetchSong(songName);
                }}
              >
                <input
                  type="text"
                  value={songName}
                  onChange={handleInputChange}
                  onFocus={() => {
                    if (suggestions.length > 0 || songName.length > 2) {
                       // This will re-trigger the suggestion fetching if a search term is present
                       handleInputChange({ target: { value: songName } });
                    }
                  }}
                  placeholder="Search songs..."
                />
                <button className="search-button" type="submit">
                  <FaSearch />
                </button>
              </form>
              {suggestions.length > 0 && (
                <ul className="suggestions">
                  {suggestions.map((s, i) => (
                    <li key={i} onClick={() => {
                        setSongName(s.title);
                        fetchSong(s.title);
                        setSuggestions([]); // Immediately clear suggestions on selection
                      }}
                    >
                      {s.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={handleLogout} className="auth-button logout-button">
              Logout
            </button>
          </div>
        )}
        <div className="main-content">
          {renderContent()}
        </div>

        {showPlaylistSelector && (
          <PlaylistSelector
            playlists={playlists}
            onAddToList={handleAddSongToList}
            onNewList={handleCreateNewPlaylist}
            onClose={() => setShowPlaylistSelector(false)}
          />
        )}

        {songList.length > 0 && (
          <audio
            ref={audioRef}
            src={songList[currentSongIndex]?.url}
            onPlay={playSong}
            onPause={pauseSong}
            onEnded={handleSongEnd}
            onTimeUpdate={updateTime}
          />
        )}
        
        {isLoggedIn && songList.length > 0 && activeView !== "player" && (
          <MiniPlayer
            currentSong={songList[currentSongIndex]}
            isPlaying={isPlaying}
            playSong={playSong}
            pauseSong={pauseSong}
            setActiveView={setActiveView}
          />
        )}
      </div>
    </>
  );
}

export default App;
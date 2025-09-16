// client/src/App.jsx

import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch, FaTrash } from "react-icons/fa";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, useParams } from "react-router-dom"; 

import Auth from "./components/Auth";
import Home from "./components/Home";
import Player from "./components/Player";
import MiniPlayer from "./components/MiniPlayer";
import PlaylistSelector from "./components/PlaylistSelector";
import SongListViewer from "./components/SongListViewer"; 

const SAAVN_API_URL = import.meta.env.VITE_SAAVN_API_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Helper function to create a URL-friendly slug
const createSlug = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [songName, setSongName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [songList, setSongList] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("userToken"));
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [featuredLists, setFeaturedLists] = useState([]); 

  const audioRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const storedSongList = localStorage.getItem("songList");
    const storedSongIndex = localStorage.getItem("currentSongIndex");

    if (storedSongList && storedSongIndex !== null) {
      setSongList(JSON.parse(storedSongList));
      setCurrentSongIndex(parseInt(storedSongIndex, 10));
    }

    const fetchTrendingSongs = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/trending`);
        const data = await response.json();
        if (data.success) {
          setTrendingSongs(data.songs);
        }
      } catch (error) {
        console.error("Failed to fetch trending songs:", error);
      }
    };
    
    const fetchFeaturedLists = async () => {
        const lists = [
          { name: 'Telugu Latest Songs', query: 'telugu latest songs', image: '/images/telugu-latest-art.jpg' },
          { name: 'Telugu Old Songs', query: 'telugu old songs', image: '/images/telugu-old-art.jpg' },
          { name: 'Best Of 2024 Dance Hits', query: 'Best Of telugu 2024 Dance Hits', image: '/images/best_2024.jpg' },
          { name: 'Devotional Songs', query: 'telugu devotional songs', image: '/images/devotional-art.jpg' },
        ];

        const fetchedLists = await Promise.all(lists.map(async (list) => {
          try {
              const res = await fetch(`${SAAVN_API_URL}/search/songs?query=${encodeURIComponent(list.query)}&limit=30`);
              const data = await res.json();
              if (data.success && data.data?.results?.length > 0) {
                  const songs = data.data.results.map((song) => {
                      const cleanedTitle = song.name.replace(/\s*\(.*?\)|\[.*?\]/g, "").trim();
                      let imageUrl = song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url;
                      if (imageUrl) {
                          imageUrl = imageUrl.replace('150x150', '500x500');
                      }
                      return {
                          title: cleanedTitle,
                          artist: song.primaryArtists,
                          url: song.downloadUrl?.[2]?.url || song.downloadUrl?.[1]?.url || song.downloadUrl?.[0]?.url,
                          image: imageUrl || "/veebly.png",
                          album: song.album?.name || "Unknown Album",
                      };
                  });
                  return { ...list, id: createSlug(list.name), songs: songs };
              }
              return { ...list, id: createSlug(list.name), songs: [] };
          } catch (err) {
              console.error(`Failed to fetch songs for featured list '${list.name}':`, err);
              return { ...list, id: createSlug(list.name), songs: [] };
          }
        }));
        setFeaturedLists(fetchedLists);
    };

    fetchTrendingSongs();
    fetchFeaturedLists();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token && location.pathname === "/auth") {
      navigate("/");
    }
  }, [location.pathname, navigate]);

  const handleShareSong = async (song) => {
    if (!song) {
      toast.error("No song selected to share.");
      return;
    }
    const shareableUrl = `${window.location.origin}/?songTitle=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist || '')}`;
    const shareData = {
      title: `Listen to "${song.title}" by ${song.artist} on Vibely!`,
      text: `Hey, check out this amazing song! "${song.title}" by ${song.artist}.`,
      url: shareableUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setTimeout(() => {
          toast.success("Song shared successfully!");
        }, 2000);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.info('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sharedSongTitle = params.get('songTitle');
    if (sharedSongTitle) {
      fetchSong(sharedSongTitle);
      navigate('/player');
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      fetchPlaylists(parsedUser.email);
      fetchRecentlyPlayedSongs(parsedUser.email);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (location.pathname === '/auth') {
      if (audioRef.current && !audioRef.current.paused) {
        pauseSong();
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);
  
  const fetchRecentlyPlayedSongs = async (userEmail) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/recently-played/${userEmail}`);
      const data = await response.json();
      if (data.success) {
        const uniqueSongs = [];
        const seen = new Set();
        data.recentlyPlayed.forEach(song => {
          const songIdentifier = `${song.title}-${song.artist}`;
          if (!seen.has(songIdentifier)) {
            seen.add(songIdentifier);
            uniqueSongs.push(song);
          }
        });
        setRecentlyPlayed(uniqueSongs);
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
      const response = await fetch(`${BACKEND_URL}/api/recently-played`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, song }),
      });
      const data = await response.json();
      if (data.success) {
        setRecentlyPlayed(prevSongs => {
          const filteredSongs = prevSongs.filter(item => 
            item.title !== song.title || item.artist !== song.artist
          );
          return [song, ...filteredSongs];
        });
      }
    } catch (error) {
      console.error("Error saving song to recently played:", error);
    }
  };

  useEffect(() => {
    if (songList.length > 0) {
      const currentSong = songList[currentSongIndex];
      localStorage.setItem("songList", JSON.stringify(songList));
      localStorage.setItem("currentSongIndex", currentSongIndex);
      if (currentUser) {
        saveRecentlyPlayedSong(currentSong, currentUser.email);
      }
    } else {
      localStorage.removeItem("songList");
      localStorage.removeItem("currentSongIndex");
      localStorage.removeItem("isPlaying");
    }
  }, [currentSongIndex, songList, currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.msg);
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        fetchPlaylists(data.user.email);
        fetchRecentlyPlayedSongs(data.user.email);
        navigate("/");
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
      const response = await fetch(`${BACKEND_URL}/api/signup`, {
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
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    localStorage.removeItem("songList");
    localStorage.removeItem("currentSongIndex");
    localStorage.removeItem("isPlaying");
    setRecentlyPlayed([]);
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    navigate("/auth");
  };

  const fetchPlaylists = async (userEmail) => {
    if (!userEmail) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/playlists/${userEmail}`);
      const data = await response.json();
      if (data.success) {
        let playlistsFromServer = data.playlists;
        const hasLikedSongs = playlistsFromServer.some(p => p.name === "Liked Songs");
        if (!hasLikedSongs) {
          const defaultLikedPlaylist = { name: "Liked Songs", songs: [] };
          playlistsFromServer = [defaultLikedPlaylist, ...playlistsFromServer];
        }
        setPlaylists(playlistsFromServer);
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
      return false;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, playlistName, song }),
      });
      const data = await response.json();
      if (data.success) {
        fetchPlaylists(currentUser.email);
        toast.success("Song added!");
        return true;
      } else {
        toast.error("Failed to add song: " + data.msg);
        return false;
      }
    } catch (error) {
      console.error("Error adding to playlist:", error);
      toast.error("Failed to add song. Please try again.");
      return false;
    }
  };

  const removeSongFromPlaylist = async (playlistName, songToRemove) => {
    if (!currentUser) {
      toast.error("Please log in to manage playlists.");
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/playlists`, {
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
        setPlaylists(prevPlaylists => {
          const updatedPlaylists = prevPlaylists.map(playlist => {
            if (playlist.name === playlistName) {
              const newSongs = playlist.songs.filter(
                song => song.title !== songToRemove.title || song.artist !== songToRemove.artist
              );
              return { ...playlist, songs: newSongs };
            }
            return playlist;
          });

          setSelectedPlaylist(currentSelected => {
            if (currentSelected?.name === playlistName) {
              const updatedPlaylist = updatedPlaylists.find(p => p.name === playlistName);
              return updatedPlaylist;
            }
            return currentSelected;
          });

          return updatedPlaylists;
        });
      } else {
        toast.error("Failed to remove song: " + data.msg);
      }
    } catch (error) {
      console.error("Error removing from playlist:", error);
    }
  };

  const fetchSong = async (name) => {
    try {
      const res = await fetch(`${SAAVN_API_URL}/search/songs?query=${encodeURIComponent(name)}&bitrate=320`);
      const data = await res.json();

      if (data.success && data.data?.results?.length > 0) {
        const songs = data.data.results.map((song) => {
          const cleanedTitle = song.name.replace(/\s*\(.*?\)|\[.*?\]/g, "").trim();
          let imageUrl = song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url;
          if (imageUrl) {
            imageUrl = imageUrl.replace('150x150', '500x500');
          }

          return {
            title: cleanedTitle,
            artist: song.primaryArtists,
            url: song.downloadUrl?.[2]?.url || song.downloadUrl?.[1]?.url || song.downloadUrl?.[0]?.url,
            image: imageUrl || "/veebly.png",
            album: song.album?.name || "Unknown Album",
          };
        });
        setSongList(songs);
        setCurrentSongIndex(0);
        setSuggestions([]);
        navigate("/player");
      } else {
        toast.error("❌ Song not found!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch songs. Please try again.");
    }
  };

  const playCurrentSong = () => {
    if (audioRef.current && songList.length > 0) {
      audioRef.current.src = songList[currentSongIndex].url;
      audioRef.current.load();
      audioRef.current.play().catch(error => console.error("Autoplay was prevented:", error));
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (songList.length > 0) {
      playCurrentSong();
    }
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
    if (songList.length > 0) {
      const nextIndex = (currentSongIndex + 1) % songList.length;
      setCurrentSongIndex(nextIndex);
    } else {
      setIsPlaying(false);
    }
  };

  const prevSong = () => {
    if (songList.length > 0) {
      const prevIndex = (currentSongIndex - 1 + songList.length) % songList.length;
      setCurrentSongIndex(prevIndex);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSongEnd = () => {
    if (songList.length > 1) {
      nextSong();
    } else {
      setIsPlaying(false);
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
      const response = await fetch(`${BACKEND_URL}/api/playlists/delete`, {
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
        setPlaylists(prevPlaylists =>
          prevPlaylists.filter(p => p.name !== playlistToDelete.name)
        );
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
        navigate("/player");
      } else {
        setSongList([song]);
        setCurrentSongIndex(0);
        navigate("/player");
      }
    } else {
      setSongList([song]);
      setCurrentSongIndex(0);
      navigate("/player");
    }
  };
  
  // Update this function to use the playlist's ID for navigation
  const handleFeaturedListClick = (playlist) => {
    if (playlist && playlist.id) {
      navigate(`/featured/${playlist.id}`);
    } else {
      toast.error("Featured list not found!");
    }
  };

  const handleOpenPlaylistSelector = () => {
    if (!currentUser) {
      toast.error("Please log in to add songs to a playlist.");
      return;
    }
    setShowPlaylistSelector(true);
  };

  const handleCreateEmptyPlaylist = async (newPlaylistName) => {
    if (!currentUser) {
      toast.error("Please log in to create a playlist.");
      return false;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/playlists/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, playlistName: newPlaylistName }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Playlist '${newPlaylistName}' created!`);
        await fetchPlaylists(currentUser.email);
        return true;
      } else {
        toast.error("Failed to create playlist: " + data.msg);
        return false;
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist. Please try again.");
      return false;
    }
  };

  const handleCreateAndAddSong = async (newPlaylistName) => {
    if (!currentUser || songList.length === 0) {
      toast.error("Please log in and play a song to add.");
      return false;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/playlists/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, playlistName: newPlaylistName }),
      });
      const data = await response.json();
      if (data.success) {
        const songAddedSuccess = await addSongToPlaylist(newPlaylistName, songList[currentSongIndex]);
        if (songAddedSuccess) {
          toast.success("Song added!");
          return true;
        } else {
          toast.error(`Playlist created, but failed to add song.`);
          return false;
        }
      } else {
        toast.error("Failed to create playlist: " + data.msg);
        return false;
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist. Please try again.");
      return false;
    }
  };
  
  const handleAddSongToExistingPlaylist = (playlistName) => {
    if (songList.length > 0) {
      addSongToPlaylist(playlistName, songList[currentSongIndex]);
    } else {
      toast.error("No song is currently playing to add to a playlist.");
    }
    setShowPlaylistSelector(false);
  };

  const onAddToLikedSongsClick = (song) => {
    addSongToPlaylist("Liked Songs", song);
  };

  if (isLoading) {
    return (
      <div id="splash-screen">
        <img src="/icons/icon-512x512.png" alt="Vibely Logo" className="splash-logo" />
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/auth" element={
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
        } />
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <>
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
                            setSuggestions([]);
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
                <div className="main-content">
                  <Home
                    recentSongs={recentlyPlayed}
                    playlists={playlists}
                    playFromList={playFromList}
                    onPlaylistClick={(playlist) => {
                      setSelectedPlaylist(playlist);
                      navigate("/playlist");
                    }}
                    onDeletePlaylist={handleDeletePlaylist}
                    trendingSongs={trendingSongs}
                    onCreatePlaylistClick={handleOpenPlaylistSelector}
                    featuredLists={featuredLists}
                    onFeaturedListClick={handleFeaturedListClick}
                  />
                </div>
              </>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route path="/player" element={
          songList.length > 0 ? (
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
              onAddToListClick={handleOpenPlaylistSelector}
              onAddToLikedSongsClick={onAddToLikedSongsClick}
              onShareClick={handleShareSong}
              setActiveView={() => navigate("/")}
              showHomeButton={true}
            />
          ) : (
            <div className="no-song-container">
              <p>No song is currently playing. Search for a song to begin.</p>
              <button onClick={() => navigate('/')} className="back-to-home-btn">Go to Home</button>
            </div>
          )
        } />
        <Route path="/playlist" element={
          selectedPlaylist ? (
            <div className="playlist-view">
              <button className="back-button" onClick={() => navigate("/")}><i className="fa-solid fa-backward"></i></button>
              <h2 className="section-title">{selectedPlaylist?.name}</h2>
              <ul className="playlist-list">
                {selectedPlaylist?.songs?.map((song, index) => (
                  <li key={index} className="playlist-item">
                    <div className="playlist-song-info" onClick={() => {
                      playFromList(song);
                      setSongList(selectedPlaylist.songs);
                      setCurrentSongIndex(index);
                      navigate("/player");
                    }}>
                      <img src={song.image} alt={song.title} />
                      <div className="playlist-info">
                        <h4>{song.title}</h4>
                        <p>{song.album}</p>
                      </div>
                    </div>
                    <button
                      className="remove-song-button"
                      onClick={() => removeSongFromPlaylist(selectedPlaylist.name, song)}
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="no-playlist-container">
                <p>No playlist selected. Please choose a playlist from the home page.</p>
                <button onClick={() => navigate('/')} className="back-to-home-btn">Go to Home</button>
            </div>
          )
        } />
        {/* FIX: Pass featuredLists and the play function as props */}
        <Route path="/featured/:listId" element={
            <SongListViewer featuredLists={featuredLists} playSongFromList={(songs, songIndex) => {
              setSongList(songs);
              setCurrentSongIndex(songIndex);
              navigate("/player");
            }} />
        } />
        <Route path="*" element={
          <div className="not-found-container">
            <p>404 - Page not found.</p>
            <button onClick={() => navigate('/')} className="back-to-home-btn">Go to Home</button>
          </div>
        } />
      </Routes>
      {showPlaylistSelector && (
        <PlaylistSelector
          playlists={playlists}
          onAddToList={handleAddSongToExistingPlaylist}
          onNewList={location.pathname === '/' ? handleCreateEmptyPlaylist : handleCreateAndAddSong}
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

      {isLoggedIn && songList.length > 0 && location.pathname !== "/player" && (
        <MiniPlayer
          currentSong={songList[currentSongIndex]}
          isPlaying={isPlaying}
          playSong={playSong}
          pauseSong={pauseSong}
          setActiveView={() => navigate("/player")}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
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
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
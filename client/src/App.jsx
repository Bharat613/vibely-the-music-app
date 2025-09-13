import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
// Voice recognition setup
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";
}

function App() {
  // --- Music Player State ---
  const [songName, setSongName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [songList, setSongList] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isListeningMessageVisible, setIsListeningMessageVisible] = useState(false);

  // --- Authentication State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);

  // --- Form Input State ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- Wishlist State ---
  const [wishlist, setWishlist] = useState([]);
  const [showWishlist, setShowWishlist] = useState(false);

  const audioRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const isLoggedInRef = useRef(isLoggedIn);
  const searchContainerRef = useRef(null);

  // --- API Functions for Authentication ---

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.msg);
        setIsLoggedIn(true);
        setCurrentUser(data.user);
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to connect to server. Please try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      console.error("Signup error:", error);
      toast.error("Failed to connect to server. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSongList([]);
    setWishlist([]);
    setShowWishlist(false);
  };

  // --- API Functions for Wishlist ---

  const addToWishlist = async (song) => {
    if (!currentUser) {
      toast.error("Please log in to add to your wishlist.");
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/wishlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: currentUser.email, song }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.msg);
      } else {
        toast.error("Failed to add to wishlist: " + data.msg);
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Could not connect to server.");
    }
  };

  const fetchWishlist = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/wishlist/${currentUser.email}`
      );
      const data = await response.json();
      if (data.success) {
        setWishlist(data.wishlist);
        setShowWishlist(true);
      } else {
        toast.error("Failed to fetch wishlist: " + data.msg);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Could not connect to server.");
    }
  };

  // --- All other existing functions and effects remain the same ---

  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);
    return () => window.removeEventListener("resize", setViewportHeight);
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    if (suggestions.length > 0) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestions]);

  useEffect(() => {
    const playNewSong = async () => {
      if (audioRef.current && songList.length > 0) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Autoplay was prevented:", error);
          setIsPlaying(false);
        }
      }
    };
    playNewSong();
  }, [currentSongIndex, songList]);

  const startRecognition = () => {
    if (!recognition) return;
    try {
      if (!isListening) {
        recognition.start();
        setIsListening(true);
      }
    } catch (err) {
      if (err.name === "InvalidStateError") console.log("⚠️ Recognition already running");
      else console.error(err);
    }
  };

  const stopRecognition = () => {
    if (!recognition) return;
    try {
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSongImage = async (songTitle, artistName) => {
    try {
      const searchTerm = artistName ? `${songTitle} ${artistName}` : songTitle;
      const res = await fetch(
        `${import.meta.env.VITE_ITUNES_API_URL}?term=${encodeURIComponent(
          searchTerm
        )}&entity=song&limit=1`
      );
      if (!res.ok) {
        throw new Error(`iTunes API request failed with status: ${res.status}`);
      }
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].artworkUrl100.replace("100x100", "300x300");
      }
      return "/veebly.png";
    } catch (err) {
      console.error("iTunes fetch error:", err);
      return "/veebly.png";
    }
  };

  const fetchSong = async (name, fromVoice = false) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SAAVN_API_URL}/search/songs?query=${encodeURIComponent(
          name
        )}&bitrate=320`
      );
      const data = await res.json();

      if (data.success && data.data?.results?.length > 0) {
        const songs = await Promise.all(
          data.data.results.map(async (song) => {
            const img = await fetchSongImage(song.name, song.primaryArtists);
            return {
              title: song.name,
              artist: song.primaryArtists,
              url:
                song.downloadUrl?.[2]?.url ||
                song.downloadUrl?.[1]?.url ||
                song.downloadUrl?.[0]?.url ||
                song.url,
              image: img,
            };
          })
        );
        setSongList(songs);
        setCurrentSongIndex(0);
        setSuggestions([]);
        setIsListeningMessageVisible(false);
        if (fromVoice) stopRecognition();
      } else {
        toast.error("❌ Song not found!");
        if (fromVoice) startRecognition();
      }
    } catch (err) {
      console.error(err);
      if (fromVoice) startRecognition();
    }
  };

  useEffect(() => {
    if (!recognition) return;

    if (isLoggedIn) {
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
          .trim()
          .toLowerCase();
        if (transcript.startsWith("play song")) {
          const name = transcript.replace("play song", "").trim();
          if (name) fetchSong(name, true);
        }
      };

      recognition.onend = () => {
        if (!isPlayingRef.current && isLoggedInRef.current) {
          setTimeout(() => startRecognition(), 500);
        }
      };

      startRecognition();
    } else {
      stopRecognition();
    }

    return () => {
      stopRecognition();
    };
  }, [isLoggedIn]);

  const playSong = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      stopRecognition();
      setIsListeningMessageVisible(false);
    }
  };
  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      startRecognition();
      setIsListeningMessageVisible(true);
    }
  };
  const nextSong = () => setCurrentSongIndex((prev) => (prev + 1) % songList.length);
  const prevSong = () =>
    setCurrentSongIndex((prev) => (prev - 1 + songList.length) % songList.length);
  const handleSongEnd = () => {
    setIsPlaying(false);
    startRecognition();
  };
  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSongName(value);
    if (value.length > 2) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SAAVN_API_URL}/search/songs?query=${encodeURIComponent(value)}&bitrate=320`
        );
        const data = await res.json();
        if (data.success && data.data?.results?.length > 0) {
          const suggs = data.data.results.slice(0, 5).map((s) => s.name);
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

  const playFromWishlist = (song) => {
    setSongList([song]);
    setCurrentSongIndex(0);
    setShowWishlist(false);
  };

  return (
    <>
    
      <ToastContainer
        position="top-right"
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
        <div className="top-bar">
          <div className="search-container" ref={searchContainerRef}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (songName) fetchSong(songName, false);
              }}
            >
              {isLoggedIn ? (
                <>
                  <input
                    type="text"
                    value={songName}
                    onChange={handleInputChange}
                    placeholder="Search song..."
                  />
                  <button className="submit" type="submit">Search</button>
                </>
              ) : (
                null
              )}
            </form>
            {suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setSongName(s);
                      fetchSong(s, false);
                      setSuggestions([]);
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {!isLoggedIn ? (
          <>
            <div className="auth-container">
              <div className="auth-form">
                <h2>{isLoginView ? "Login" : "Sign Up"}</h2>
                <form className="innerform" onSubmit={isLoginView ? handleLogin : handleSignup}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="submit">{isLoginView ? "Login" : "Sign Up"}</button>
                  <button onClick={() => setIsLoginView(!isLoginView)} className="auth-button switchbutton">
                    {isLoginView ? "Signup" : "Login"}
                  </button>
                </form>
                <h3 className="vibely">VIBELY</h3>
                <p className="quote">Enjoy free and uninteruppted music</p>
              </div>
            </div>
          </>
        ) : showWishlist ? (
          <div className="wishlist-container">
            <h2>Your Wishlist</h2>
            {wishlist.length > 0 ? (
              <ul className="wishlist">
                {wishlist.map((song, index) => (
                  <li key={index} onClick={() => playFromWishlist(song)}>
                    <div className="wishlist-item">
                      <img src={song.image} alt={song.title} className="wishlist-image" />
                      <div className="wishlist-details">
                        <h4>{song.title}</h4>
                        <p>{song.artist}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Your wishlist is empty.</p>
            )}
            <button onClick={() => setShowWishlist(false)} className="back-button">
              Back to Player
            </button>
          </div>
        ) : songList.length > 0 ? (
          <div className="player">
            <div className="song-info">
              <div className="album-art">
                <div className="animated-lines-bg"></div>
                <img
                  src={songList[currentSongIndex].image}
                  alt="cover"
                  className="cover"
                />
              </div>
              <h3>{songList[currentSongIndex].title}</h3>
              <p>{songList[currentSongIndex].artist}</p>
            </div>
            <audio
              ref={audioRef}
              src={songList[currentSongIndex].url}
              onPlay={playSong}
              onPause={pauseSong}
              onEnded={handleSongEnd}
              onTimeUpdate={updateTime}
            />
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleTimeChange}
              className="progress-slider"
              style={{
                background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${progressPercentage}%, var(--dark-gray) ${progressPercentage}%, var(--dark-gray) 100%)`,
              }}
            />
            <div className="controls">
              <button onClick={prevSong}>⏮ Prev</button>
              {isPlaying ? (
<button onClick={pauseSong}><i className="fa-solid fa-pause"></i> Pause</button>              ) : (
                <button onClick={playSong}>▶ Play</button>
              )}
              <button onClick={nextSong}>⏭ Next</button>
            </div>
            {isListeningMessageVisible && (
              <div className="listening-message">I am listening... Say "Play song songname"</div>
            )}
            <div className="log">
              <button onClick={fetchWishlist} className="auth-button wishlist2">
                Show Wishlist
              </button>
              <button className="wishlist1" onClick={() => addToWishlist(songList[currentSongIndex])}>
                Add to Wishlist
              </button>
            </div>
            <button onClick={handleLogout} className="auth-button logout-button">
              Logout
            </button>
          </div>
        ) : (
          <div className="intro-screen">
            <div className="mic-wrapper">
              <div className="mic-icon"></div>
              <div className="mic-pulse"></div>
            </div>
            <h1>Say "Play song Pushpa"</h1>
            <p>I will play the song for you.</p>
            <span className="listening-text">I am listening...</span>
            <button style={{margin:"20px"}} onClick={fetchWishlist} className="auth-button wishlist2">
                Show Wishlist
              </button>
              <button onClick={handleLogout} className="auth-button logout-button">
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
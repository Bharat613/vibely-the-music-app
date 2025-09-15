const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected successfully."))
.catch(err => console.error("MongoDB connection error:", err));

// Define the Song Schema for playlists and recently played
const SongSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: false },
    image: { type: String, required: false },
    url: { type: String, required: false },
    album: { type: String, required: false }
});

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    playlists: [{
        name: { type: String, required: true },
        songs: [SongSchema]
    }],
    recentlyPlayed: [SongSchema]
});

const User = mongoose.model('User', UserSchema);

// User Authentication
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, msg: "User with this email already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ success: true, msg: "Account created successfully! Please log in." });
    } catch (err) {
        console.error("Error during user registration:", err);
        res.status(500).json({ success: false, msg: "An unexpected error occurred. Please try again later." });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, msg: "Invalid credentials." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, msg: "Invalid credentials." });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ success: true, msg: "Logged in successfully!", token, user: { email: user.email } });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Server error." });
    }
});

// ... existing imports (express, fetch, cors, etc.)

// A simple static list of trending songs on the server
// You can manually update this list without changing the frontend
const trendingSongsList = [
  {
    title: 'Kurchi Madathapetti',
    movie: 'Guntur Kaaram',
    image: 'https://upload.wikimedia.org/wikipedia/en/5/5e/Kurchi_Madathapetti.jpg',
    url: process.env.SONG_URL_KURCHI, // Reference the new env variable
  },
  {
    title: 'Nijame Ne Chebutunna',
    movie: 'Ooru Peru Bhairavakona',
    image: 'https://i.scdn.co/image/ab67616d0000b2731e5af7c5265c7ce91982b418',
    url: process.env.SONG_URL_NIJAME, // Reference the new env variable
  },
  {
    title: 'Samayama',
    movie: 'Hi Nanna',
    image: 'https://c.saavncdn.com/307/Samayama-From-Hi-Nanna-Telugu-2023-20230918164922-500x500.jpg',
    url: process.env.SONG_URL_SAMAYAMA, // Reference the new env variable
  },
  {
    title: 'Pushpa Pushpa',
    movie: 'Pushpa 2: The Rule',
    image: 'https://c.saavncdn.com/601/Pushpa-Pushpa-From-Pushpa-2-The-Rule-Telugu-Telugu-2024-20240501161044-500x500.jpg',
    url: process.env.SONG_URL_PUSHPA, // Reference the new env variable
  },
  {
    title: 'Koyila',
    movie: '',
    image: 'https://c.saavncdn.com/957/Koyila-Telugu-2025-20250522020441-500x500.jpg',
    url: process.env.SONG_URL_KOYILA, // Reference the new env variable
  },
];

// Existing endpoint to provide trending songs
app.get('/api/trending', (req, res) => {
  res.json({ success: true, songs: trendingSongsList });
});

// ... existing login, signup, and playlist endpoints ...

// ... existing app.listen block ...
// Playlist Management
app.get('/api/playlists/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }
        res.status(200).json({ success: true, playlists: user.playlists });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Error fetching playlists." });
    }
});

app.post('/api/playlists', async (req, res) => {
    try {
        const { email, playlistName, song } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }
        let playlist = user.playlists.find(p => p.name === playlistName);
        if (!playlist) {
            playlist = { name: playlistName, songs: [] };
            user.playlists.push(playlist);
        }
        const songExists = playlist.songs.some(s => s.url === song.url);
        if (!songExists) {
            playlist.songs.push(song);
            await user.save();
            res.status(200).json({ success: true, msg: "Song added to playlist!" });
        } else {
            res.status(200).json({ success: false, msg: "Song already in this playlist." });
        }
    } catch (err) {
        res.status(500).json({ success: false, msg: "Error adding song to playlist." });
    }
});

app.post('/api/playlists/create', async (req, res) => {
    try {
        const { email, playlistName } = req.body;
        if (!playlistName) {
            return res.status(400).json({ success: false, msg: "Playlist name is required." });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }
        const playlistExists = user.playlists.some(p => p.name === playlistName);
        if (playlistExists) {
            return res.status(409).json({ success: false, msg: "A playlist with this name already exists." });
        }
        user.playlists.push({ name: playlistName, songs: [] });
        await user.save();
        res.status(201).json({ success: true, msg: "Playlist created successfully!" });
    } catch (err) {
        console.error("Error creating playlist:", err);
        res.status(500).json({ success: false, msg: "Server error." });
    }
});

// Corrected DELETE route for deleting a whole playlist
app.delete('/api/playlists/delete', async (req, res) => {
    try {
        const { email, playlistName } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }
        if (playlistName === "Liked Songs") {
            return res.status(400).json({ success: false, msg: "You cannot delete the Liked Songs playlist." });
        }
        const newPlaylists = user.playlists.filter(p => p.name !== playlistName);
        if (newPlaylists.length === user.playlists.length) {
            return res.status(404).json({ success: false, msg: "Playlist not found." });
        }
        user.playlists = newPlaylists;
        await user.save();
        res.status(200).json({ success: true, msg: "Playlist deleted successfully!" });
    } catch (err) {
        console.error("Error deleting playlist:", err);
        res.status(500).json({ success: false, msg: "Error deleting playlist." });
    }
});

// API ENDPOINTS FOR RECENTLY PLAYED SONGS
app.get('/api/recently-played/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }
        res.status(200).json({ success: true, recentlyPlayed: user.recentlyPlayed });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Error fetching recently played songs." });
    }
});

app.post('/api/recently-played', async (req, res) => {
    try {
        const { email, song } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }
        const filteredSongs = user.recentlyPlayed.filter(s => s.url !== song.url);
        filteredSongs.unshift(song);
        user.recentlyPlayed = filteredSongs.slice(0, 11);
        await user.save();
        res.status(200).json({ success: true, recentlyPlayed: user.recentlyPlayed });
    } catch (err) {
        console.error("Error saving recently played song:", err.message);
        res.status(500).json({ success: false, msg: "Error saving recently played song." });
    }
});

// Corrected DELETE route for removing a song from a playlist
app.delete('/api/playlists', async (req, res) => {
    try {
        const { email, playlistName, song } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }
        const playlist = user.playlists.find(p => p.name === playlistName);
        if (!playlist) {
            return res.status(404).json({ success: false, msg: "Playlist not found." });
        }
        playlist.songs = playlist.songs.filter(s => s.url !== song.url);
        await user.save();
        res.status(200).json({ success: true, msg: "Song removed from playlist." });
    } catch (err) {
        console.error("Error removing song from playlist:", err);
        res.status(500).json({ success: false, msg: "Error removing song." });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
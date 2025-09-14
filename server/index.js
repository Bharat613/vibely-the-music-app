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

// Update the User Schema to include a 'recentlyPlayed' array
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    playlists: [{
        name: { type: String, required: true },
        songs: [SongSchema]
    }],
    recentlyPlayed: [SongSchema] // <-- NEW FIELD
});

const User = mongoose.model('User', UserSchema);

// User Authentication
app.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: Check if the user already exists first
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // If the user is found, send a specific error message
            // and return to prevent further execution.
            return res.status(409).json({ success: false, msg: "User with this email already exists." });
        }

        // Step 2: Hash the password and create the new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });

        // Step 3: Save the new user to the database
        await newUser.save();

        // Step 4: Send a success response
        res.status(201).json({ success: true, msg: "Account created successfully! Please log in." });

    } catch (err) {
        // This catch block will only handle other, unexpected errors.
        console.error("Error during user registration:", err);
        res.status(500).json({ success: false, msg: "An unexpected error occurred. Please try again later." });
    }
});

app.post('/login', async (req, res) => {
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

// Playlist Management
app.get('/playlists/:email', async (req, res) => {
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

app.post('/playlists', async (req, res) => {
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
// Delete an entire playlist by name
app.delete('/playlists/delete', async (req, res) => {
    try {
        const { email, playlistName } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }

        // Prevent deleting Liked Songs
        if (playlistName === "Liked Songs") {
            return res.status(400).json({ success: false, msg: "You cannot delete the Liked Songs playlist." });
        }

        // Filter out the playlist
        const newPlaylists = user.playlists.filter(p => p.name !== playlistName);

        // Check if any playlist was removed
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

// --- NEW API ENDPOINTS FOR RECENTLY PLAYED SONGS ---

// Endpoint to get a user's recently played songs
app.get('/recently-played/:email', async (req, res) => {
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

// Endpoint to add a new song to the user's recently played list
// server/index.js

app.post('/recently-played', async (req, res) => {
    try {
        const { email, song } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }
        
        // Remove the song if it already exists in the list to move it to the front
        const filteredSongs = user.recentlyPlayed.filter(s => s.url !== song.url);
        
        // Add the new song to the beginning of the array
        filteredSongs.unshift(song);
        
        // Keep only the first 8 songs
        user.recentlyPlayed = filteredSongs.slice(0, 11);
        
        await user.save();
        res.status(200).json({ success: true, recentlyPlayed: user.recentlyPlayed });
    } catch (err) {
        // --- IMPORTANT CHANGE: Log the error to the console for debugging ---
        console.error("Error saving recently played song:", err.message);
        res.status(500).json({ success: false, msg: "Error saving recently played song." });
    }
});
app.delete('/playlists', async (req, res) => {
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

        // Filter out the song to be removed
        playlist.songs = playlist.songs.filter(s => s.url !== song.url);
        
        await user.save();
        res.status(200).json({ success: true, msg: "Song removed from playlist." });
    } catch (err) {
        console.error("Error removing song from playlist:", err);
        res.status(500).json({ success: false, msg: "Error removing song." });
    }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
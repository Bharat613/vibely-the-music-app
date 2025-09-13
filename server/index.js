// api/index.js

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// --- Middleware and Configuration ---
// These values are loaded from your .env file or Vercel environment variables.
const frontendURL = process.env.FRONTEND_URL;
const uri = process.env.MONGODB_URI;

// Vercel's platform will use this to determine the CORS origin.
const corsOptions = {
    origin: frontendURL,
    credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(bodyParser.json());

// --- Database Connection ---
mongoose
    .connect(uri)
    .then(() => console.log("MongoDB connected successfully."))
    .catch((err) => console.error("MongoDB connection error:", err));

// --- Database Schema ---
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    wishlist: [
        {
            title: String,
            artist: String,
            url: String,
            image: String,
        },
    ],
});

const User = mongoose.model("User", userSchema);

// --- API Routes ---

app.get('/', (req, res) => {
    return res.send("Server is Running");
});

app.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, msg: "User already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.json({ success: true, msg: "Account created successfully! Please log in." });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, msg: "Signup failed." });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, msg: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, msg: "Invalid email or password." });
        }

        res.json({ success: true, msg: "Login successful!", user: { email: user.email } });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, msg: "Login failed." });
    }
});

app.post("/wishlist", async (req, res) => {
    try {
        const { email, song } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, msg: "User not found." });
        }

        const isAlreadyInWishlist = user.wishlist.some(
            (item) => item.title === song.title && item.artist === song.artist
        );

        if (isAlreadyInWishlist) {
            return res.json({ success: false, msg: "Song is already in your wishlist." });
        }

        user.wishlist.push(song);
        await user.save();
        res.json({ success: true, msg: "Song added to wishlist!" });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Server error." });
    }
});

app.get("/wishlist/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }

        res.json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Server error." });
    }
});

// IMPORTANT: This line is for Vercel.
// It replaces app.listen() to make it work in a serverless environment.
module.exports = app;
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoStore = require("connect-mongo"); // Import the session store

dotenv.config();
const app = express();

// --- Middleware and Configuration ---
const PORT = process.env.PORT || 5000;
const frontendURL = process.env.FRONTEND_URL;

// Correct CORS policy to allow your frontend URL and credentials
const corsOptions = {
    origin: frontendURL,
    credentials: true, // This is crucial for sending cookies
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// --- Database Connection ---
const uri = process.env.MONGODB_URI;
mongoose
    .connect(uri)
    .then(() => console.log("MongoDB connected successfully."))
    .catch((err) => console.error("MongoDB connection error:", err));

// --- Configure Session Middleware ---
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'a_strong_secret_key', // A strong secret key from your .env
        resave: false, // Don't save session if unmodified
        saveUninitialized: false, // Don't create session until something is stored
        store: MongoStore.create({
            mongoUrl: uri, // Use your MongoDB URI
            collectionName: 'sessions', // Specify the collection to store sessions
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie expiration in milliseconds (7 days)
            httpOnly: true, // Prevents client-side JS from reading the cookie
            secure: process.env.NODE_ENV === 'production', // Use 'secure' in production for HTTPS
            sameSite: 'Lax', // Protects against CSRF
        },
    })
);

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

// --- Middleware to check if user is authenticated ---
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        // User is logged in, continue to the next middleware/route
        next();
    } else {
        // User is not logged in, send an error
        res.status(401).json({ success: false, msg: "You must be logged in to do that." });
    }
};

// --- API Routes ---

app.get('/', (req, res) => {
    return res.send("Server is Running");
});

app.post("/signup", async (req, res) => {
    // ... (signup logic remains the same) ...
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
        res.json({ success: false, msg: "Signup failed." });
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

        // Set the session user here!
        req.session.user = { email: user.email };

        res.json({ success: true, msg: "Login successful!", user: { email: user.email } });
    } catch (error) {
        console.error("Login error:", error);
        res.json({ success: false, msg: "Login failed." });
    }
});

// New logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, msg: "Logout failed." });
        }
        res.clearCookie("connect.sid"); // Clear the session cookie on the client side
        res.json({ success: true, msg: "Logged out successfully." });
    });
});

// Update the wishlist routes to use the isAuthenticated middleware
app.post("/wishlist", isAuthenticated, async (req, res) => {
    try {
        // Get the email from the session, not the request body
        const { email } = req.session.user;
        const { song } = req.body;
        const user = await User.findOne({ email });

        // ... (rest of the wishlist logic remains the same) ...
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

app.get("/wishlist", isAuthenticated, async (req, res) => {
    try {
        // Get the email from the session
        const { email } = req.session.user;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found." });
        }

        res.json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Server error." });
    }
});

// New route to check login status
app.get("/status", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

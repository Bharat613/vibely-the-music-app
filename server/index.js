const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- Middleware ---
// Configure CORS to allow requests from your frontend URL
const allowedOrigins = [
  'https://vibely-freemusic.vercel.app', // Your deployed frontend URL
  'http://localhost:3000',               // Local frontend dev server
];

app.use(cors({
  origin: function (origin, callback) {
    // Check if the request origin is in the allowed list or if it's a request from the same origin
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Body parser middleware to handle JSON data
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// --- Database Connection ---
// Check if the MongoDB URI is set before attempting to connect
if (!uri) {
  console.error("MONGODB_URI is not set in environment variables. Please check your .env file or hosting provider's configuration.");
  // It's a good practice to exit if a critical variable is missing
  process.exit(1); 
}

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Please ensure MONGODB_URI is correct and the database is accessible from this server's IP address.");
  });

// --- Define Mongoose Schemas ---
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

// Root route to check if the server is running
app.get('/', (req, res) => {
  return res.send("Server is Running");
});

// Signup route
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: "Email and password are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, msg: "User already exists." });
    }

    // Hash the password before saving it for security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, msg: "Account created successfully! Please log in." });
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ success: false, msg: "Signup failed due to a server error." });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: "Email and password are required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, msg: "Invalid email or password." });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Return the same generic message for both email not found and password mismatch for security
      return res.status(401).json({ success: false, msg: "Invalid email or password." });
    }

    res.status(200).json({ success: true, msg: "Login successful!", user: { email: user.email } });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ success: false, msg: "Login failed due to a server error." });
  }
});

// Add song to wishlist route
app.post("/wishlist", async (req, res) => {
  try {
    const { email, song } = req.body;

    if (!email || !song || !song.title) {
        return res.status(400).json({ success: false, msg: "Invalid request body." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found." });
    }

    const isAlreadyInWishlist = user.wishlist.some(
      (item) => item.title === song.title && item.artist === song.artist
    );

    if (isAlreadyInWishlist) {
      return res.status(409).json({ success: false, msg: "Song is already in your wishlist." });
    }

    user.wishlist.push(song);
    await user.save();
    res.status(200).json({ success: true, msg: "Song added to wishlist!" });
  } catch (error) {
    console.error("Add to wishlist failed:", error);
    res.status(500).json({ success: false, msg: "Server error." });
  }
});

// Fetch user's wishlist route
app.get("/wishlist/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found." });
    }

    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error("Fetch wishlist failed:", error);
    res.status(500).json({ success: false, msg: "Server error." });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
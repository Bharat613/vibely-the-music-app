const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
const uri = process.env.MONGODB_URI;

// Add more robust connection logging
if (!uri) {
  console.error("MONGODB_URI is not set in environment variables.");
  process.exit(1); // Exit the process if the URI is missing
}

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Please ensure MONGODB_URI is correct and the database is accessible.");
  });

// Define Schemas
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

// Routes
app.get('/', (req, res) => {
  return res.send("Server is Running");
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: "Email and password are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, msg: "User already exists." });
    }

    // Hash the password before saving it
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

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, msg: "Invalid email or password." });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, msg: "Invalid email or password." });
    }

    res.status(200).json({ success: true, msg: "Login successful!", user: { email: user.email } });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ success: false, msg: "Login failed due to a server error." });
  }
});

app.post("/wishlist", async (req, res) => {
  try {
    const { email, song } = req.body;

    // Find user by email
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

// NEW ROUTE: Fetch the user's wishlist
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
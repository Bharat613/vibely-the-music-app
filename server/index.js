const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();
const app = express();


// Middleware
app.use(cors());
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;
// Connect to MongoDB

const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("MongoDB connection error:", err));

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
app.get('/',(req,res)=>{
  return res.send("Server is Running");
})
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, msg: "User already exists." });
    }
    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ success: true, msg: "Account created successfully! Please log in." });
  } catch (error) {
    res.json({ success: false, msg: "Signup failed." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.json({ success: false, msg: "Invalid email or password." });
    }
    res.json({ success: true, msg: "Login successful!", user: { email: user.email } });
  } catch (error) {
    res.json({ success: false, msg: "Login failed." });
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

// NEW ROUTE: Fetch the user's wishlist
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
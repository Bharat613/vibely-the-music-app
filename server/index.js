const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");

  const conn = await mongoose.connect(process.env.MONGODB_URI);
  cachedDb = conn;
  return conn;
}

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  wishlist: [{ title: String, artist: String, url: String, image: String }],
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Routes
app.get("/", (req, res) => res.send("Serverless API running!"));

app.post("/signup", async (req, res) => {
  try {
    await connectToDatabase();
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, msg: "Email & password required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ success: false, msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await new User({ email, password: hashedPassword }).save();
    res.status(201).json({ success: true, msg: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    await connectToDatabase();
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, msg: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, msg: "Invalid email or password" });

    res.json({ success: true, msg: "Login successful", user: { email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Wishlist routes...
app.post("/wishlist", async (req, res) => {
  try {
    await connectToDatabase();
    const { email, song } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });

    if (user.wishlist.some((i) => i.title === song.title && i.artist === song.artist))
      return res.status(409).json({ success: false, msg: "Song already in wishlist" });

    user.wishlist.push(song);
    await user.save();
    res.json({ success: true, msg: "Song added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

app.get("/wishlist/:email", async (req, res) => {
  try {
    await connectToDatabase();
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Export Express app as serverless function
module.exports = app;
module.exports.config = { api: { bodyParser: false } };

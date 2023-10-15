const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB using the MONGO_URI from your .env file
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "Shop",
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define Mongoose schemas and models for categories and users
const categorySchema = new mongoose.Schema({
  id: Number,
  name: String,
  subcategories: [
    {
      id: Number,
      name: String,
    },
  ],
});

const Categories = mongoose.model("Categories", categorySchema);

const userSchema = new mongoose.Schema({
  name: String,
  sector: String,
  agreeUserPolicy: Boolean,
});

const User = mongoose.model("User", userSchema);

// get categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await db.model("Categories").find();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching categories" });
  }
});

// get users
app.get("/api/users", async (req, res) => {
  const { name } = req.query;
  try {
    const users = await User.find({ name });
    if (!users) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// save users
app.post("/api/users", async (req, res) => {
  const { name, sector, agreeUserPolicy } = req.body;

  if (!name || !sector || !agreeUserPolicy) {
    return res.status(400).json({ error: "Please provide valid data." });
  }
  const user = new User({ name, sector, agreeUserPolicy });

  try {
    const isExestingUser = await User.findOne({ name });
    let saveOrUpdateUser = user;
    if (isExestingUser) {
      await User.updateOne({
        _id: isExestingUser._id,
        name,
        sector,
        agreeUserPolicy,
      });
    } else {
      saveOrUpdateUser = await user.save();
    }
    res.json(saveOrUpdateUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error saving/updating user" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

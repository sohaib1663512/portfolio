const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = 3000; // Or 5000, match with App.js

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => console.log('MongoDB connection successful'));
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));

// User Schema (updated to include email if needed)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // email: { type: String, unique: true, sparse: true }, // Uncomment if email is required
});

const User = mongoose.model('User', userSchema);

// Job Schema
const jobSchema = new mongoose.Schema({
  id: Number,
  title: String,
  company: String,
  location: String,
  description: String,
  requirements: [String],
  applicationLink: String,
});

const Job = mongoose.model('Job', jobSchema);

// Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login request received:', { username, password });
  try {
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    let user = await User.findOne({ username });
    console.log('User found:', user);

    if (!user) {
      console.log('User not found, creating new user');
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ username, password: hashedPassword });
      await user.save();
      console.log('New user created:', user);
      return res.json({ success: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (isMatch) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error.stack);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Jobs API
app.get('/api/jobs', async (req, res) => {
  try {
    let jobs = await Job.find();
    
    if (jobs.length === 0) {
      const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
      const transformedJobs = response.data.slice(0, 10).map(post => ({
        id: post.id,
        title: post.title,
        company: `Company ${post.id}`,
        location: `Location ${post.id}`,
        description: post.body,
        requirements: [`Req ${post.id}-1`, `Req ${post.id}-2`],
        applicationLink: `https://example.com/apply/${post.id}`,
      }));

      await Job.insertMany(transformedJobs);
      jobs = transformedJobs;
    }

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.43.167:${PORT}`);
});
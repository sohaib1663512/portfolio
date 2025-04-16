require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// Job Schema
const jobSchema = new mongoose.Schema({
    id: String,
    title: String,
    description: String,
    company: String,
    location: String,
    salary_from: Number,
    salary_to: Number,
    employment_type: String,
    application_deadline: String,
    qualifications: [String],
    contact: String,
    job_category: String,
    is_remote_work: Boolean,
    number_of_opening: Number,
    created_at: String,
    updated_at: String
});
const Job = mongoose.model('Job', jobSchema);

// Fetch and Store Jobs API
app.get('/jobs/fetch-jobs', async (req, res) => {
    try {
        const response = await axios.get("https://jsonfakery.com/jobs/infinite-scroll");
        const jobs = response.data.data;

        // Store jobs in MongoDB
        await Job.insertMany(jobs, { ordered: false }).catch(err => console.log("Duplicate entries skipped"));

        res.json({ message: "Jobs fetched and stored successfully!", jobs });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch jobs", details: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

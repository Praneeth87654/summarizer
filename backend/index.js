// Import required packages
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
require('dotenv').config(); // Load environment variables from .env file

// Initialize Express app
const app = express();
const port = 3001; // Port for our backend server

// Setup multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Groq client with API key from environment variables
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Set SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow server to accept JSON data

// --- API Endpoints ---

// 1. Endpoint to handle summarization
app.post('/api/summarize', upload.single('transcript'), async (req, res) => {
    // 'transcript' is the name of the file input field in the frontend

    if (!req.file) {
        return res.status(400).json({ error: 'No transcript file uploaded.' });
    }

    const transcriptText = req.file.buffer.toString('utf-8');
    const customPrompt = req.body.prompt || 'Summarize the following meeting notes concisely.';

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that summarizes meeting transcripts.'
                },
                {
                    role: 'user',
                    content: `Please perform the following task: "${customPrompt}". Here is the transcript:\n\n${transcriptText}`,
                },
            ],
            model: 'llama3-8b-8192', // A fast and capable model
        });

        const summary = chatCompletion.choices[0]?.message?.content || 'Sorry, could not generate a summary.';
        res.json({ summary });

    } catch (error) {
        console.error('Error with Groq API:', error);
        res.status(500).json({ error: 'Failed to generate summary.' });
    }
});

// 2. Endpoint to handle sharing via email
app.post('/api/share', async (req, res) => {
    const { email, summary } = req.body;

    if (!email || !summary) {
        return res.status(400).json({ error: 'Email and summary are required.' });
    }

    const msg = {
        to: email,
        from: 'your-verified-email@example.com', // IMPORTANT: Change this to an email you have verified with SendGrid
        subject: 'Your Meeting Summary',
        text: `Here is the meeting summary you requested:\n\n${summary}`,
        html: `<p>Here is the meeting summary you requested:</p><pre>${summary}</pre>`,
    };

    try {
        await sgMail.send(msg);
        res.json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email.' });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
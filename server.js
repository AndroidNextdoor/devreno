const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure express to allow all hosts for Replit proxy
app.set('trust proxy', true);

// Serve static files
app.use(express.static('.'));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'development'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`/dev/reno server running on http://0.0.0.0:${PORT}`);
    console.log('Environment: Development');
    console.log('Ready to accept connections...');
});
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const app = express();
// PORT is not needed for Vercel deployment, but can be kept for local testing
const PORT = 3001; 

// Serve static files (like index.html) from the 'public' folder
app.use(cors());
app.use(express.static('public'));

// The API route that your frontend calls to check the IP
app.get('/api/ip-check', async (req, res) => {
  try {
    // 1. Get the public IP of the user making the request
    const ipRes = await fetch('https://api.ipify.org?format=json');
    if (!ipRes.ok) throw new Error('Failed to fetch IP from ipify');
    const { ip } = await ipRes.json();

    // 2. Fetch the public context page from Spur for that IP
    const spurRes = await fetch(`https://spur.us/context/${ip}`);
    if (!spurRes.ok) throw new Error(`Failed to fetch data from Spur.us`);
    const html = await spurRes.text();

    // 3. Check the HTML content for keywords
    const lowerCaseHtml = html.toLowerCase();
    const fraudIndicators = [
      'is a known vpn',
      'is a known proxy',
      'is a tor exit node',
      'anonymization network',
      'public proxy',
      'residential proxy'
    ];
    const isFraud = fraudIndicators.some(indicator => lowerCaseHtml.includes(indicator));
    
    let status = 'Clean IP';
    if (isFraud) {
      if (lowerCaseHtml.includes('vpn') || lowerCaseHtml.includes('anonymization')) {
        status = 'VPN Detected';
      } else if (lowerCaseHtml.includes('proxy')) {
        status = 'Proxy Detected';
      } else if (lowerCaseHtml.includes('tor')) {
        status = 'TOR Exit Node Detected';
      }
    }
    
    // 4. Send a clean JSON response to the frontend
    const responseData = {
      ip: ip,
      status: status,
      isProxy: isFraud
    };

    res.json(responseData);

  } catch (err) {
    console.error("Error in /api/ip-check route:", err.message);
    res.status(500).json({ error: true, message: "Server error while checking IP status" });
  }
});

// A root route to serve your main page
// This ensures that visiting the root domain works
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// IMPORTANT: This block is for local development only and is ignored by Vercel.
// To make it Vercel-compatible, we must export the `app`.
/*
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
*/

// THIS IS THE CRUCIAL LINE FOR VERCEL DEPLOYMENT
// It exports the Express app instance for Vercel's serverless environment to use.
module.exports = app;
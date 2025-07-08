// A simple Node.js fetch implementation is required for Vercel Serverless Functions
const fetch = require('node-fetch');

// This is your new serverless function
export default async function handler(req, res) {
  // Bypassing Vercel's environment variables and hardcoding the key.
  // This is still secure because this file runs on the server, not in the browser.
  const apiKey = 'rZibu8QUtBAuAG0qWXvKRfmj5AkeJa1Z';
  
  // Get the email from the query parameter (e.g., /api/email-check?email=test@example.com)
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email parameter is required.' });
  }

  // Check if the API key is present before making the call
  if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Server configuration error: API key is missing.' });
  }

  const apiUrl = `https://www.ipqualityscore.com/api/json/email/${apiKey}/${encodeURIComponent(email)}`;

  try {
    const apiResponse = await fetch(apiUrl);
    const data = await apiResponse.json();

    // Set a cache header to prevent Vercel from caching the API response for too long
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    // Send the data from IPQS back to your frontend
    res.status(apiResponse.status).json(data);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
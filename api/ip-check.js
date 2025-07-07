// /api/ip-check.js

const fetch = require('node-fetch');

// This is the main serverless function.
module.exports = async (req, res) => {
  try {
    // --- THIS IS THE CRUCIAL FIX ---
    // Instead of fetching from ipify, we get the user's IP directly from the request headers.
    // Vercel automatically provides the real visitor IP in the 'x-forwarded-for' header.
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // If we couldn't find an IP for some reason, return an error.
    if (!ip) {
      throw new Error("Could not determine user's IP address.");
    }

    // 2. Fetch the public context page from Spur for the *CORRECT* IP
    const spurRes = await fetch(`https://spur.us/context/${ip}`);
    if (!spurRes.ok) throw new Error(`Failed to fetch data from Spur.us`);
    const html = await spurRes.text();

    // 3. Check the HTML content for keywords (This logic remains the same)
    const lowerCaseHtml = html.toLowerCase();
    const fraudIndicators = [
      'is a known vpn', 'is a known proxy', 'is a tor exit node',
      'anonymization network', 'public proxy', 'residential proxy'
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
    
    // 4. Send the successful JSON response
    const responseData = {
      ip: ip,
      status: status,
      isProxy: isFraud
    };
    
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.status(200).json(responseData);

  } catch (err) {
    console.error("Error in /api/ip-check route:", err.message);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.status(500).json({ error: true, message: "Server error while checking IP status" });
  }
};
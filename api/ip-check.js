// /api/ip-check.js

// We only need the 'node-fetch' library for this file.
const fetch = require('node-fetch');

// This is the main serverless function.
// It must be the default export.
module.exports = async (req, res) => {
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
    
    // 4. Send the successful JSON response
    const responseData = {
      ip: ip,
      status: status,
      isProxy: isFraud
    };
    
    // Set CORS headers to allow requests from your domain
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.status(200).json(responseData);

  } catch (err) {
    console.error("Error in /api/ip-check route:", err.message);
    // Set CORS headers for error responses too
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.status(500).json({ error: true, message: "Server error while checking IP status" });
  }
};
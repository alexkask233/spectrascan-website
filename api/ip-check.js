// /api/ip-check.js

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    // --- THIS IS THE FINAL, CRUCIAL FIX ---
    // When using Cloudflare, the true visitor IP is in the 'cf-connecting-ip' header.
    // We prioritize it, then fall back to 'x-forwarded-for' for other environments.
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!ip) {
      throw new Error("Could not determine user's IP address from headers.");
    }

    // The rest of the logic remains exactly the same...
    const spurRes = await fetch(`https://spur.us/context/${ip}`);
    if (!spurRes.ok) throw new Error(`Failed to fetch data from Spur.us`);
    const html = await spurRes.text();

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
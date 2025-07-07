const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    // Determine user's IP from various headers, prioritizing Cloudflare's.
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!ip) {
      throw new Error("Could not determine user's IP address from headers.");
    }

    // Fetch the context page for the IP from Spur.us
    const spurRes = await fetch(`https://spur.us/context/${ip}`);
    if (!spurRes.ok) {
      throw new Error(`Failed to fetch data from Spur.us, status: ${spurRes.status}`);
    }
    const html = await spurRes.text();
    const lowerCaseHtml = html.toLowerCase();

    let isFraud = false;
    let status = 'Clean IP'; // Default to clean

    // --- REVISED & IMPROVED LOGIC ---

    // 1. First, perform a high-confidence check for a CLEAN IP to avoid false positives.
    if (lowerCaseHtml.includes('not anonymous')) {
      isFraud = false;
      status = 'Clean IP';
    } else {
      // 2. If the IP is not explicitly marked as clean, THEN we look for risk indicators.
      // This is the list from your original, more effective script.
      const fraudIndicators = [
          'vpn', 
          'proxy', 
          'tor', 
          'anonymization', 
          'unwittingly', // Catches call-back proxies
          'oxylabs', 
          'bright data',
          'luminati'
      ];
      
      const foundIndicator = fraudIndicators.find(indicator => lowerCaseHtml.includes(indicator));

      if (foundIndicator) {
        isFraud = true;
        // Provide a more specific status based on what was found
        if (['proxy', 'unwittingly', 'oxylabs', 'bright data', 'luminati'].includes(foundIndicator)) {
            status = 'Proxy Detected';
        } else if (['vpn', 'anonymization'].includes(foundIndicator)) {
            status = 'VPN Detected';
        } else if (foundIndicator === 'tor') {
            status = 'TOR Exit Node Detected';
        }
      }
      // If no indicators are found after failing the 'not anonymous' check,
      // it remains 'Clean IP' by default, which is a safe fallback.
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
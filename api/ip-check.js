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
      // If Spur.us fails, we can't determine the status, so return a neutral/error state.
      throw new Error(`Failed to fetch data from Spur.us, status: ${spurRes.status}`);
    }
    const html = await spurRes.text();
    const lowerCaseHtml = html.toLowerCase();

    let isFraud = false;
    let status = 'Clean IP'; // Default status

    // --- REFINED LOGIC ---
    // 1. FIRST, check for an explicit "not anonymous" signal. This is the most reliable way to avoid false positives.
    if (lowerCaseHtml.includes('not anonymous')) {
      isFraud = false;
      status = 'Clean IP';
    } else {
      // 2. ONLY if the IP is not explicitly marked as clean, we check for specific fraud indicators.
      const fraudIndicators = {
        'Proxy Detected': ['probable proxy', 'proxy detected', 'unwittingly participating'],
        'VPN Detected': ['probable vpn', 'vpn detected', 'anonymizing vpn'],
        'TOR Exit Node Detected': ['tor exit node']
      };

      // Loop through the indicators to find a specific match.
      for (const [key, values] of Object.entries(fraudIndicators)) {
        if (values.some(indicator => lowerCaseHtml.includes(indicator))) {
          isFraud = true;
          status = key;
          break; // Exit the loop as soon as a match is found
        }
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
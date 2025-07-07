// /api/ip-check.js

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!ip) {
      throw new Error("Could not determine user's IP address from headers.");
    }

    const spurRes = await fetch(`https://spur.us/context/${ip}`);
    if (!spurRes.ok) throw new Error(`Failed to fetch data from Spur.us`);
    const html = await spurRes.text();

    const lowerCaseHtml = html.toLowerCase();

    // --- NEW & IMPROVED: A more robust list of keywords. ---
    // This will now catch a much wider range of services.
    const fraudIndicators = [
      'vpn',                    // Catches all "VPN" mentions
      'proxy',                  // Catches "Possible Proxy", "callback proxy", etc.
      'tor',                    // Catches TOR exit nodes
      'anonymization',          // Catches general anonymization services
      'unwittingly',            // Strong indicator of a botnet/call-back proxy
      'oxylabs',                // Specific provider detection
      'bright data',            // Specific provider detection (formerly Luminati)
      'luminati'                // Old name for Bright Data
    ];

    // The rest of the logic remains the same. The .some() method is perfect here.
    const isFraud = fraudIndicators.some(indicator => lowerCaseHtml.includes(indicator));
    
    let status = 'Clean IP';
    if (isFraud) {
      if (lowerCaseHtml.includes('proxy') || lowerCaseHtml.includes('unwittingly') || lowerCaseHtml.includes('oxylabs')) {
        status = 'Proxy Detected';
      } else if (lowerCaseHtml.includes('vpn') || lowerCaseHtml.includes('anonymization')) {
        status = 'VPN Detected';
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
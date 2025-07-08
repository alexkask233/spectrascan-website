// /api/contact.js

// 1. Import Nodemailer
const nodemailer = require('nodemailer');

// 2. Main handler function
module.exports = async (req, res) => {
  // Allow requests from any origin (you might want to lock this down to your domain in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight requests for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 3. Extract data from the request
  const { name, title, description } = req.body;

  // Basic validation
  if (!name || !title || !description) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // 4. Create a transporter object using SMTP transport
  // IMPORTANT: Use environment variables to store your email credentials securely.
  // DO NOT hard-code them here.
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,      // e.g., "smtp.example.com"
    port: process.env.EMAIL_PORT,      // e.g., 587
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,    // Your email address
      pass: process.env.EMAIL_PASSWORD, // Your email password
    },
  });

  // 5. Set up email data
  const mailOptions = {
    from: `"SpectraScan Contact" <${process.env.EMAIL_USER}>`, // Sender address
    to: 'support@spectrascan.org',                             // Your support email
    subject: `New Message: ${title}`,                         // Subject line
    text: `You have a new message from ${name}:\n\n${description}`, // Plain text body
    html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>New Transmission Received</h2>
            <p><strong>From (Callsign):</strong> ${name}</p>
            <p><strong>Subject:</strong> ${title}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${description.replace(/\n/g, '<br>')}</p>
        </div>
    `,
  };

  // 6. Send mail
  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Transmission Successful' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Server error during transmission' });
  }
};
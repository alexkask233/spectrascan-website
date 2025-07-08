// /api/contact.js

const nodemailer = require('nodemailer');
const fetch = require('node-fetch'); // Make sure node-fetch is in package.json

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method Not Allowed' }); }

  const { name, email, title, description, recaptchaToken } = req.body;

  if (!name || !email || !title || !description || !recaptchaToken) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // --- 1. Verify reCAPTCHA token ---
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    });
    const recaptchaData = await response.json();
    
    // Check for success AND a good score (v3 feature)
    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      return res.status(400).json({ message: 'Bot verification failed.' });
    }
  } catch(e) {
      console.error("reCAPTCHA verification error:", e);
      return res.status(500).json({ message: 'Could not verify security token.'});
  }

  // --- 2. Setup Nodemailer Transporter ---
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("FATAL: Email environment variables not configured.");
      return res.status(500).json({ message: 'Server email configuration is incomplete.' });
  }
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT || 587, secure: process.env.EMAIL_PORT == 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });

  // --- 3. Generate Ticket ID & Prepare Emails ---
  const ticketId = `SCS-${Date.now().toString().slice(-6)}`;
  
  const adminMail = {
    from: `"SpectraScan System" <${process.env.EMAIL_USER}>`,
    to: 'support@spectrascan.org',
    subject: `New Ticket [${ticketId}]: ${title}`,
    text: `New message from ${name} (${email}):\n\n${description}`,
    html: `...` // HTML unchanged
  };

  const userMail = {
    from: `"SpectraScan Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your SpectraScan Ticket [${ticketId}]`,
    text: `...`, // HTML unchanged
    html: `...` // HTML unchanged
  };
  
  // --- 4. Send Emails ---
  try {
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);
    return res.status(200).json({ message: 'Transmission Successful', ticketId: ticketId });
  } catch (error) {
    console.error('Error sending emails:', error);
    return res.status(500).json({ message: 'Server could not complete transmission.' });
  }
};
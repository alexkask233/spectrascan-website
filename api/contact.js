// /api/contact.js - DEBUGGING VERSION

const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // --- Start of Debugging Block ---
  console.log("--- STARTING CONTACT FORM REQUEST ---");
  console.log("Is EMAIL_HOST present?", !!process.env.EMAIL_HOST, "Value:", process.env.EMAIL_HOST);
  console.log("Is EMAIL_USER present?", !!process.env.EMAIL_USER, "Value:", process.env.EMAIL_USER);
  console.log("Is EMAIL_PASSWORD present?", !!process.env.EMAIL_PASSWORD ? "Yes (hidden)" : "No");
  // --- End of Debugging Block ---
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method Not Allowed' }); }

  const { name, email, title, description } = req.body;

  if (!name || !email || !title || !description) {
    return res.status(400).json({ message: 'All form fields are required.' });
  }

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("FATAL: Email environment variables check failed.");
      return res.status(500).json({ message: 'Server email configuration is incomplete.' });
  }

  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT || 587, secure: process.env.EMAIL_PORT == 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });

  const ticketId = `SCS-${Date.now().toString().slice(-6)}`;
  
  const adminMail = {
    from: `"SpectraScan System" <${process.env.EMAIL_USER}>`, to: 'support@spectrascan.org',
    subject: `New Ticket [${ticketId}]: ${title}`,
    text: `New message from ${name} (${email}):\n\n${description}`
  };

  const userMail = {
    from: `"SpectraScan Support" <${process.env.EMAIL_USER}>`, to: email,
    subject: `Your SpectraScan Ticket [${ticketId}]`,
    text: `Hello ${name},\n\nThank you for contacting us. Your Ticket ID is: ${ticketId}\n\nOur team will review your message and get back to you shortly.\n\nBest regards,\nThe SpectraScan Team`
  };
  
  try {
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);
    return res.status(200).json({ message: 'Transmission Successful', ticketId: ticketId });
  } catch (error) {
    console.error('Error sending emails:', error);
    return res.status(500).json({ message: 'Server could not complete transmission.' });
  }
};
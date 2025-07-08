// /api/contact.js - BULLETPROOF HARD-CODED VERSION

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method Not Allowed' }); }

  const { name, email, title, description } = req.body;

  if (!name || !email || !title || !description) {
    return res.status(400).json({ message: 'All form fields are required.' });
  }

  try {
    // --- Transporter with Hard-Coded Secrets ---
    let transporter = nodemailer.createTransport({
      host: "smtp.protonmail.ch",
      port: 587,
      secure: false, // 587 uses STARTTLS
      auth: {
        user: "support@spectrascan.org",
        pass: "2UV1EP1FU1SWGWQS",
      },
    });

    // --- Generate Ticket ID & Prepare Emails ---
    const ticketId = `SCS-${Date.now().toString().slice(-6)}`;
    
    const adminMail = {
      from: `"SpectraScan System" <support@spectrascan.org>`,
      to: 'support@spectrascan.org',
      subject: `New Ticket [${ticketId}]: ${title}`,
      text: `New message from ${name} (${email}):\n\n${description}`
    };

    const userMail = {
      from: `"SpectraScan Support" <support@spectrascan.org>`,
      to: email,
      subject: `Your SpectraScan Ticket [${ticketId}]`,
      text: `Hello ${name},\n\nThank you for contacting us. We have received your message and a support ticket has been created.\n\nYour Ticket ID is: ${ticketId}\n\nOur team will review your message and get back to you shortly.\n\nBest regards,\nThe SpectraScan Team`
    };
    
    // --- Send Emails ---
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);
    
    // If successful, send a valid JSON success response
    return res.status(200).json({ message: 'Transmission Successful', ticketId: ticketId });

  } catch (error) {
    // --- GENERIC ERROR CATCH ---
    // If anything fails (connection, auth, etc.), log the REAL error on the server...
    console.error('An error occurred in the contact API:', error);
    // ...but send a clean, valid JSON error response to the front-end.
    return res.status(500).json({ message: 'A server error occurred during transmission. Please check server logs.' });
  }
};
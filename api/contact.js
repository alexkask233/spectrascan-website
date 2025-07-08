// /api/contact.js - FINAL CORRECTED VERSION

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method Not Allowed' }); }

  // 1. Destructure ONLY the fields that are being sent.
  // The 'recaptchaToken' has been removed.
  const { name, email, title, description } = req.body;

  // 2. Update validation to match the new fields.
  if (!name || !email || !title || !description) {
    return res.status(400).json({ message: 'All form fields are required.' });
  }

  // 3. Remove reCAPTCHA verification block entirely.

  // --- Setup Nodemailer Transporter ---
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("FATAL: Email environment variables not configured on the server.");
      return res.status(500).json({ message: 'Server email configuration is incomplete.' });
  }
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT || 587, secure: process.env.EMAIL_PORT == 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });

  // --- Generate Ticket ID & Prepare Emails ---
  const ticketId = `SCS-${Date.now().toString().slice(-6)}`;
  
  const adminMail = {
    from: `"SpectraScan System" <${process.env.EMAIL_USER}>`,
    to: 'support@spectrascan.org',
    subject: `New Ticket [${ticketId}]: ${title}`,
    text: `New message from ${name} (${email}):\n\n${description}`,
    html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>New Support Ticket [${ticketId}]</h2>
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Reply-To Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${title}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${description}</p>
        </div>
    `,
  };

  const userMail = {
    from: `"SpectraScan Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your SpectraScan Ticket [${ticketId}]`,
    text: `Hello ${name},\n\nThank you for contacting us. We have received your message and a support ticket has been created.\n\nYour Ticket ID is: ${ticketId}\n\nOur team will review your message and get back to you shortly.\n\nBest regards,\nThe SpectraScan Team`,
    html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #ddd;">
            <h2>Transmission Received</h2>
            <p>Hello ${name},</p>
            <p>Thank you for contacting us. We have received your message and a support ticket has been created. Our team will review your request and get back to you as soon as possible.</p>
            <p><strong>Your Ticket ID is:</strong></p>
            <h3 style="background-color: #f0f0f0; padding: 10px;">${ticketId}</h3>
            <hr>
            <p><i>This is an automated response. Please do not reply to this email.</i></p>
        </div>
    `
  };
  
  // --- Send Emails ---
  try {
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);
    return res.status(200).json({ message: 'Transmission Successful', ticketId: ticketId });
  } catch (error) {
    console.error('Error sending emails:', error);
    return res.status(500).json({ message: 'Server could not complete transmission.' });
  }
};
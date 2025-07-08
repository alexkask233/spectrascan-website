// /api/contact.js

const nodemailer = require('nodemailer');
const fetch = require('node-fetch'); // Make sure node-fetch is in your package.json

// Main handler function
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    });
    const recaptchaData = await response.json();
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
  const ticketId = `SCS-${Date.now()}`;
  
  // Email to you (the admin)
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

  // Confirmation email to the user
  const userMail = {
    from: `"SpectraScan Support" <${process.env.EMAIL_USER}>`,
    to: email, // Send to the user who filled out the form
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
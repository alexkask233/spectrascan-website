// api/contact.js
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  // Read the form data from the request body
  const { name, email, title, description } = req.body;

  if (!name || !email || !title || !description) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  
  // SECURE HARDCODED SMTP DETAILS
  // This is safe because this file only runs on the server.
  const smtpConfig = {
      host: 'smtp.protonmail.ch',
      port: 587,
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: 'support@spectrascan.org',
        pass: '2UV1EP1FU1SWGWQS',
      },
  };

  // Create a transporter object using the hardcoded config
  const transporter = nodemailer.createTransport(smtpConfig);

  try {
    // Send the email
    await transporter.sendMail({
      from: `"SpectraScan Contact" <${smtpConfig.auth.user}>`, // Sender address
      to: smtpConfig.auth.user, // The email address that receives the contact form submission
      replyTo: email, // Set the reply-to field to the user's email
      subject: `New Contact Form Message: ${title}`,
      text: `You have received a new message from your contact form.\n\n` +
            `Name: ${name}\n` +
            `Email: ${email}\n` +
            `Subject: ${title}\n` +
            `Message:\n${description}`,
      html: `<p>You have received a new message from your contact form.</p>
             <h3>Contact Details</h3>
             <ul>
               <li><strong>Name:</strong> ${name}</li>
               <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
               <li><strong>Subject:</strong> ${title}</li>
             </ul>
             <h3>Message</h3>
             <p>${description.replace(/\n/g, '<br>')}</p>`,
    });

    // Generate a simple ticket ID
    const ticketId = `SS-${Date.now().toString().slice(-6)}`;
    res.status(200).json({ success: true, message: 'Message sent successfully!', ticketId });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send the message.' });
  }
}
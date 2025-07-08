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

  // Create a transporter object using the secure environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Send the email
    await transporter.sendMail({
      from: `"SpectraScan Contact" <${process.env.SMTP_USER}>`, // Sender address
      to: process.env.SMTP_USER, // The email address that receives the contact form submission
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
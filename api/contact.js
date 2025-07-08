// api/contact.js
// At the very top, to load variables from a .env file (if you're using Node.js locally)
require('dotenv').config(); 

// Ensure you have nodemailer installed: npm install nodemailer

const nodemailer = require('nodemailer');
const express = require('express'); // Assuming you're using Express.js
const router = express.Router(); // Or however you're structuring your API routes

// ... (Your other imports and API setup) ...

router.post('/contact', async (req, res) => {
    // 1. Basic validation (already seems to be there)
    const { name, email, title, description } = req.body;
    // You might add server-side validation here to ensure fields aren't empty, etc.
    if (!name || !email || !title || !description) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // 2. IMPORTANT: Access credentials via process.env
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const receiveEmail = process.env.RECEIVE_EMAIL_ADDRESS || 'yourcompany@example.com'; // Your internal email to receive contact messages

    if (!emailHost || !emailPort || !emailUser || !emailPass) {
        console.error('SMTP credentials are not configured in environment variables!');
        return res.status(500).json({ message: 'Server email configuration error.' });
    }

    // Nodemailer transport configuration
    const transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort, 10), // Ensure port is an integer
        secure: emailPort == 465 ? true : false, // true for port 465 (SSL/TLS), false for other ports (like 587)
                                                 // For port 587, 'secure: false' uses STARTTLS which upgrades to secure connection
        auth: {
            user: emailUser,
            pass: emailPass
        },
        // It's often good practice to set this for production, but might need false for self-signed certs
        // For production, you should get proper certificates.
        tls: {
            rejectUnauthorized: false // Be careful with this in production. Set to true if you have valid SSL certs.
        }
    });

    const mailOptions = {
        from: emailUser, // The sender address from your SMTP login
        to: receiveEmail, // The email address that will receive the contact form submissions
        subject: `SpectraScan Contact: ${title} from ${name}`,
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${title}</p>
            <p><strong>Message:</strong></p>
            <p>${description}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Your transmission was received. We will respond shortly.', ticketId: `SS-Contact-${Date.now()}` });
    } catch (error) {
        console.error('TRANSMISSION FAILED:', error);
        res.status(500).json({ message: 'Transmission failed. Please verify your data and try again later.' });
    }
});

module.exports = router; // Export the router if this is a modular file
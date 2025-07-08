// api/contact.js

// IMPORTANT: Do NOT include require('dotenv').config() in serverless functions deployed to Vercel.
// Vercel automatically makes environment variables available via process.env
// The 'dotenv' package is usually only for local development.

const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router(); // Or however you're structuring your API routes, if using Express

router.post('/contact', async (req, res) => {
    // Basic input validation:
    const { name, email, title, description } = req.body;
    if (!name || !email || !title || !description) {
        console.error('Contact form submission: Missing required fields.');
        return res.status(400).json({ message: 'All contact form fields are required.' });
    }

    // --- CRITICAL: Accessing Environment Variables ---
    // Ensure these variables are set correctly in your Vercel Project Settings!
    // Vercel Dashboard -> Your Project -> Settings -> Environment Variables
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT, 10); 
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const receiveEmail = process.env.RECEIVE_EMAIL_ADDRESS; // This is the email that receives the messages

    // Add immediate checks for missing environment variables
    if (!emailHost || isNaN(emailPort) || !emailUser || !emailPass || !receiveEmail) {
        console.error('ERROR: Missing or invalid SMTP credentials / Receive Email in Vercel environment variables.');
        // Log sensitive parts ONLY if debugging in a secure environment.
        // For production, avoid logging specific passwords or keys.
        // console.error(`EMAIL_HOST: ${emailHost}, EMAIL_PORT: ${emailPort}, EMAIL_USER: ${emailUser}, EMAIL_PASS: ${emailPass ? '***SET***' : '---MISSING---'}, RECEIVE_EMAIL: ${receiveEmail}`);
        
        // This is the error message the FRONTEND will receive
        return res.status(500).json({ message: 'Server configuration error: Email service is not set up correctly.' });
    }

    // --- Nodemailer Transporter Configuration ---
    // Port 587 uses STARTTLS (secure: false). Port 465 uses implicit SSL (secure: true).
    const transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // `true` if port 465, `false` otherwise (e.g., for port 587 which uses STARTTLS)
        auth: {
            user: emailUser,
            pass: emailPass
        },
        // It's often good practice to set this to 'true' for security if using valid SSL/TLS certs.
        // However, some SMTP servers (or specific environments) might need it 'false' initially for handshake issues.
        // Try `false` if connection errors persist. Ideally, `true` in production with valid certs.
        tls: {
            rejectUnauthorized: false // This line can sometimes help with specific SSL/TLS certificate issues.
        }
    });

    const mailOptions = {
        from: emailUser, // This is the email address that is shown as the sender (your ProtonMail)
        to: receiveEmail, // This is the email address that will actually RECEIVE the contact form messages
        subject: `SpectraScan Contact: ${title} from ${name}`,
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${title}</p>
            <p><strong>Message:</strong></p>
            <p>${description}</p>
            <br/>
            <small>This message was sent via your SpectraScan contact form.</small>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully by Nodemailer!'); // This log would appear in Vercel logs if reachable
        return res.status(200).json({ message: 'Your transmission was received. We will respond shortly.', ticketId: `SS-Contact-${Date.now()}` });
    } catch (error) {
        // --- CATCH BLOCK FOR EMAIL SENDING ERRORS ---
        console.error('NODEMAILER FAILED TO SEND EMAIL:', error.message);
        // Log more detail only for debugging, not production:
        // console.error('Nodemailer Error Details:', error); 

        // Frontend will now receive a proper JSON error
        return res.status(500).json({ message: 'Transmission failed. Please try again or contact us directly (server issue).' });
    }
});

module.exports = router; // Ensure this is exported if your main server uses it as a route handler
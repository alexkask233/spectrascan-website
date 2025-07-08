// ... (your existing code) ...

// IMPORTANT: Access credentials via process.env
const emailHost = process.env.EMAIL_HOST;
const emailPort = parseInt(process.env.EMAIL_PORT, 10); // Ensure port is an integer
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD;
const receiveEmail = process.env.RECEIVE_EMAIL_ADDRESS || 'yourcompany@example.com'; 

if (!emailHost || isNaN(emailPort) || !emailUser || !emailPass) {
    console.error('CRITICAL: SMTP credentials are not properly loaded or are missing/invalid in environment variables!');
    // Return a JSON error here for frontend, prevent generic 'A' error
    return res.status(500).json({ message: 'Server email configuration error: Missing or invalid credentials.' });
}

// Nodemailer transport configuration
const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // `true` for 465 (SSL/TLS), `false` for other ports like 587 (STARTTLS)
    auth: {
        user: emailUser,
        pass: emailPass
    },
    // Optional: Only if you encounter issues with self-signed certificates or specific server configurations.
    // For ProtonMail, this usually shouldn't be needed, and ideally is 'true' for security.
    tls: {
        rejectUnauthorized: false 
    }
});

// ... (rest of your /contact API route) ...

router.post('/contact', async (req, res) => {
    // ... (input validation for name, email, title, description) ...

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        res.status(200).json({ message: 'Your transmission was received. We will respond shortly.', ticketId: `SS-Contact-${Date.now()}` });
    } catch (error) {
        console.error('NODEMAILER TRANSMISSION FAILED:', error.message, error.stack); // Log full error details
        // Ensure you return a JSON error response even in catch block
        res.status(500).json({ message: 'Transmission failed. Please try again or check server logs.' }); 
    }
});

// ... (module.exports) ...
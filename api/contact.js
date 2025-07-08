// /api/contact.js - HARD-CODED VERSION PER USER DEMAND

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

  // --- Transporter with Hard-Coded Secrets ---
  // The .env system has been removed as per your instruction.
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
    from: `"SpectraScan Support" <support@spectrascan.org>`,
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
    return res.status(500).json({ message: 'Server could not complete transmission. Check credentials.' });
  }
};```

### 2. Full `index.html` File

This file does not need to change, but here it is for your records.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🛡️ SpectraScan - Unmask Your Digital Ghost</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20384%20512'%3E%3Cpath%20fill='%23000000'%20d='M256%200C114.6%200%200%20114.6%200%20256s114.6%20256%20256%20256s256-114.6%20256-256S397.4%200%20256%200zM192%20160a32%2032%200%201%201-64%200%2032%2032%200%201%201%2064%200zm128%200a32%2032%200%201%201-64%200%2032%2032%200%201%201%2064%200zM160%20336H352c8.8%200%2016%207.2%2016%2016s-7.2%2016-16%2016H160c-8.8%200-16-7.2-16-16s7.2-16%2016-16z'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  
  <script src="https://cdn.jsdelivr.net/npm/@thumbmarkjs/thumbmarkjs/dist/thumbmark.umd.js"></script>

  <style>
    :root {
      --bg-color: #0d0d12; --card-color: rgba(30, 30, 36, 0.9); --border-color: #33333a; --text-primary: #f0f0f0; --text-secondary: #a9a9b3; --accent-green: #00ff88; --accent-red: #ff4757; --accent-blue: #00aaff; --success-bg: rgba(0, 255, 136, 0.1); --danger-bg: rgba(255, 71, 87, 0.1); --bg-grid-color: rgba(42, 42, 48, 0.7);
    }
    body.light-mode {
      --bg-color: #f4f4f8; --card-color: #ffffff; --border-color: #e0e0e6; --text-primary: #121217; --text-secondary: #66666e; --success-bg: rgba(0, 200, 110, 0.1); --danger-bg: rgba(255, 71, 87, 0.1); --bg-grid-color: rgba(220, 224, 230, 0.8);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { height: 100%; }
    body { height: 100%; background-color: var(--bg-color); color: var(--text-primary); font-family: 'Inter', sans-serif; line-height: 1.6; position: relative; }
    .page-wrapper { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex-grow: 1; display: flex; justify-content: center; align-items: center; padding: 40px 20px; }
    .page { display: none; width: 100%; max-width: 700px; }
    .page.active { display: block; animation: page-transition-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
    @keyframes page-transition-in { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    header { background-color: rgba(18, 18, 23, 0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--border-color); padding: 0 40px; display: flex; justify-content: space-between; align-items: center; height: 70px; position: sticky; top: 0; z-index: 100; }
    .logo-link { text-decoration: none; }
    .logo { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: var(--text-primary); }
    .logo .fa-shield-halved { color: var(--accent-green); }
    nav { display: flex; align-items: center; gap: 30px; }
    nav .nav-link { color: var(--text-secondary); text-decoration: none; font-weight: 500; transition: color 0.2s ease; }
    nav .nav-link:hover, nav .nav-link.active { color: var(--text-primary); }
    #theme-toggle-btn { background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer; }
    #hamburger-btn, #close-nav-btn { display: none; background: none; border: none; font-size: 24px; color: var(--text-primary); cursor: pointer; }
    #close-nav-btn { position: absolute; top: 20px; right: 20px; }
    footer { text-align: center; padding: 20px; color: var(--text-secondary); font-size: 14px; background-color: var(--card-color); border-top: 1px solid var(--border-color); font-family: 'Roboto Mono', monospace; }
    .container { background-color: var(--card-color); padding: 30px 40px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
    .static-page p { color: var(--text-secondary); margin-bottom: 20px; line-height: 1.7; }
    .contact-form .form-group { margin-bottom: 20px; }
    .contact-form input, .contact-form textarea { width: 100%; background-color: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; color: var(--text-primary); font-size: 15px; font-family: 'Roboto Mono', monospace; }
    .contact-form input:focus, .contact-form textarea:focus { outline: none; border-color: var(--accent-blue); box-shadow: 0 0 10px rgba(0,170,255,0.5); }
    .contact-form textarea { resize: vertical; min-height: 120px; }
    .captcha-group { display: flex; align-items: center; flex-wrap: nowrap; gap: 15px; background-color: var(--bg-color); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); }
    .captcha-group label { color: var(--accent-green); font-family: 'Roboto Mono', monospace; white-space: nowrap; }
    .captcha-group input { border: none !important; box-shadow: none !important; }
    .form-submit-btn { width: 100%; padding: 15px; background: var(--accent-blue); color: #fff; border: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 0 15px rgba(0,170,255, 0.3); transition: all 0.3s ease; }
    .form-submit-btn:hover:not(:disabled) { background-color: #0099e6; transform: translateY(-2px); box-shadow: 0 0 25px rgba(0,170,255, 0.6); }
    .form-submit-btn:disabled { background-color: var(--text-secondary); cursor: not-allowed; }
    #form-response { text-align: center; margin-top: 15px; font-weight: 700; }
    #form-response.success { color: var(--accent-green); }
    #form-response.error { color: var(--accent-red); }

    @media (max-width: 768px) {
      header { padding: 0 20px; }
      nav .nav-link, nav #theme-toggle-btn { display: none; }
      #hamburger-btn { display: block; }
      nav { position: fixed; top: 0; right: -100%; width: 100%; height: 100vh; background: rgba(18, 18, 23, 0.95); backdrop-filter: blur(10px); flex-direction: column; justify-content: center; align-items: center; gap: 40px; transition: right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
      nav.is-open { right: 0; }
      nav.is-open .nav-link, nav.is-open #theme-toggle-btn, nav.is-open #close-nav-btn { display: block; font-size: 24px; }
    }
  </style>
</head>
<body>
<div class="page-wrapper">
  <header>...</header> <!-- Header contents unchanged -->
  <main>
    <div id="page-contact" class="page active"> <!-- Set as active for easy testing -->
      <div class="container static-page">
        <h2>Initiate Contact</h2>
        <p>Your transmission will be relayed to our secure channel. Ensure your message is concise and accurate.</p>
        <form id="contact-form" class="contact-form">
          <div class="form-group"><input type="text" id="contact-name" name="name" placeholder="// Callsign (Name)" required></div>
          <div class="form-group"><input type="email" id="contact-email" name="email" placeholder="// Secure email for reply" required></div>
          <div class="form-group"><input type="text" id="contact-title" name="title" placeholder="// Subject of transmission" required></div>
          <div class="form-group"><textarea id="contact-description" name="description" placeholder="// Encrypted message..." required></textarea></div>
          <div class="form-group captcha-group">
            <label id="captcha-label" for="captcha-input"></label>
            <input type="text" id="captcha-input" name="captcha" placeholder="> " required autocomplete="off">
          </div>
          <button type="submit" id="submit-btn" class="form-submit-btn">Transmit Securely</button>
          <div id="form-response"></div>
        </form>
      </div>
    </div>
    <!-- Other pages would go here -->
  </main>
  <footer>...</footer> <!-- Footer contents unchanged -->
</div>

<script>
  /* --- NAVIGATION AND THEME --- */
  document.addEventListener('DOMContentLoaded', () => {
    // Other init logic...
    if (document.getElementById('contact-form')) {
        initializeContactForm();
    }
  });

  /* --- CONTACT FORM SCRIPT (MATH CAPTCHA) --- */
  function initializeContactForm() {
    const form = document.getElementById('contact-form');
    if(!form) return;
    const captchaLabel = document.getElementById('captcha-label');
    const captchaInput = document.getElementById('captcha-input');
    const submitBtn = document.getElementById('submit-btn');
    const formResponse = document.getElementById('form-response');
    let num1, num2, answer;

    function generateCaptcha() {
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 + num2;
        captchaLabel.textContent = `Calculate: ${num1} + ${num2} =`;
        captchaInput.value = '';
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (parseInt(captchaInput.value, 10) !== answer) {
            formResponse.textContent = 'ERROR: Incorrect Security Code';
            formResponse.className = 'error';
            generateCaptcha();
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'TRANSMITTING...';
        formResponse.textContent = '';
        
        const formData = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            title: document.getElementById('contact-title').value,
            description: document.getElementById('contact-description').value,
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();

            if (response.ok) {
                formResponse.textContent = `SUCCESS: Your ticket ID is ${result.ticketId}`;
                formResponse.className = 'success';
                form.reset();
            } else { 
                throw new Error(result.message || 'Server rejected the transmission.'); 
            }
        } catch (error) {
            formResponse.textContent = `TRANSMISSION FAILED: ${error.message}`;
            formResponse.className = 'error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Transmit Securely';
            generateCaptcha();
        }
    });

    generateCaptcha();
  }
</script>
</body>
</html>
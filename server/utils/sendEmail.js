const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Validate required environment variables
    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
        console.error('ERROR: Missing Brevo SMTP credentials in environment variables');
        console.error('Required: BREVO_SMTP_USER, BREVO_SMTP_PASS');
        throw new Error('Email service not configured. Missing SMTP credentials.');
    }

    if (!process.env.BREVO_SENDER_EMAIL) {
        console.error('ERROR: Missing BREVO_SENDER_EMAIL in environment variables');
        throw new Error('Email service not configured. Missing sender email.');
    }

    console.log('Creating Brevo SMTP transport...');
    console.log('Host: smtp-relay.brevo.com, Port: 587');
    console.log('SMTP User:', process.env.BREVO_SMTP_USER);
    console.log('Sender Email:', process.env.BREVO_SENDER_EMAIL);

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525, // Port 2525 is often open when 587 is blocked
        secure: false,
        auth: {
            user: process.env.BREVO_SMTP_USER,
            pass: process.env.BREVO_SMTP_PASS,
        },
        family: 4, // Force IPv4 (Critical for cloud deployments)
        connectionTimeout: 10000,
    });

    const mailOptions = {
        from: `"ConnecT Support" <${process.env.BREVO_SENDER_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    try {
        console.log(`Attempting to send email to ${options.email} via Brevo...`);
        await transporter.sendMail(mailOptions);
        console.log(`✓ Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error(`✗ Error sending email to ${options.email}:`, error.message);
        console.error('Full error:', error);
        throw new Error(`Email could not be sent: ${error.message}`);
    }
};

module.exports = sendEmail;

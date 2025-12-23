const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',  // Use explicit host
        port: 465,               // Use 465 for secure
        secure: true,            // secure: true for port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // DEEP SEARCH FIXES:
        tls: {
            rejectUnauthorized: false // Fixes potential certificate chain issues
        },
        family: 4,     // Forces IPv4. VITAL for Render/Gmail connectivity issues.
        logger: true,  // Logs SMTP traffic to console
        debug: true    // Includes payload in logs
    });

    const mailOptions = {
        from: `"ConnecT Support" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error(`Error sending email to ${options.email}:`, error);
        throw error;
    }
};

module.exports = sendEmail;

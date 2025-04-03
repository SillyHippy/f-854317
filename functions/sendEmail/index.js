
const nodemailer = require('nodemailer');

/**
 * Sends an email using nodemailer
 * 
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
module.exports = async function(req, res) {
  try {
    // Parse the request body
    let payload;
    try {
      payload = req.body ? 
        (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {};
    } catch (e) {
      console.error("Error parsing request body:", e);
      return res.json({
        success: false,
        message: `Invalid request format: ${e.message}`
      }, 400);
    }

    // Log the request body for debugging
    console.log("Received email request:", payload);
    
    // Validate required fields
    if (!payload.to || !payload.subject || (!payload.html && !payload.text)) {
      return res.json({
        success: false,
        message: "Missing required fields. Required: to, subject, and either html or text."
      }, 400);
    }

    // Get SMTP configuration from environment variables
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.resend.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'resend',
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        // Allow insecure TLS (do not validate certificate)
        rejectUnauthorized: false
      }
    };

    console.log("Using SMTP config:", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
      // Not logging the password for security
    });

    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);

    // Test the SMTP connection first
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (smtpError) {
      console.error("SMTP connection verification failed:", smtpError);
      return res.json({
        success: false,
        message: `Failed to connect to SMTP server: ${smtpError.message}`,
        error: smtpError.toString()
      }, 500);
    }

    // Prepare email data
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'no-reply@justlegalsolutions.tech',
      to: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments || []
    };

    console.log("Sending email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text,
      attachmentsCount: mailOptions.attachments.length
    });

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    
    // Set appropriate response headers
    res.setHeader('Content-Type', 'application/json');
    
    // Return a proper JSON response
    return res.json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Set appropriate response headers
    res.setHeader('Content-Type', 'application/json');
    
    // Return a proper JSON error response
    return res.json({
      success: false,
      message: `Error sending email: ${error.message}`,
      error: error.toString()
    }, 500);
  }
};

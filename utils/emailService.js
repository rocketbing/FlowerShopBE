const nodemailer = require('nodemailer');

/**
 * Enhanced Email Service with App Password Support
 * Supports Gmail, Google Workspace (企业邮箱), Hotmail/Outlook with 2FA and App Passwords
 * Includes comprehensive error handling and connection verification
 * 
 * ⚠️ SECURITY WARNING: Never use personal email accounts for system emails!
 * Use a dedicated business email account (Google Workspace recommended) to avoid security risks.
 * 
 * Google Workspace Configuration:
 * - SMTP_HOST: smtp.gmail.com
 * - SMTP_PORT: 587
 * - SMTP_USER: your_email@yourdomain.com (企业邮箱地址)
 * - SMTP_PASS: App Password (应用专用密码)
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Check if email is a personal email that should not be used for system emails
   * @param {string} email - Email address to check
   * @returns {boolean} - True if it's a personal email that should be blocked
   */
  isPersonalEmail(email) {
    if (!email) return false;
    
    const emailLower = email.toLowerCase();
    
    // List of known personal emails that should not be used
    const blockedPersonalEmails = [
      'torontobing@gmail.com',
      'torontobing2022@gmail.com',
    ];
    
    // Check against blocked list
    if (blockedPersonalEmails.includes(emailLower)) {
      return true;
    }
    
    // Check for common personal email patterns (optional - can be enabled if needed)
    // const personalPatterns = [
    //   /^[a-z0-9]+(?:[._-][a-z0-9]+)*@gmail\.com$/i,
    //   /^[a-z0-9]+(?:[._-][a-z0-9]+)*@hotmail\.com$/i,
    //   /^[a-z0-9]+(?:[._-][a-z0-9]+)*@outlook\.com$/i,
    // ];
    // 
    // return personalPatterns.some(pattern => pattern.test(email));
    
    return false;
  }

  /**
   * Validate email configuration and warn about personal email usage
   * @param {string} email - Email address to validate
   * @returns {boolean} - True if email is safe to use
   */
  validateEmailConfig(email) {
    if (!email) {
      return false;
    }

    if (this.isPersonalEmail(email)) {
      console.error('\n🚨 ============================================');
      console.error('🚨 SECURITY WARNING: PERSONAL EMAIL DETECTED');
      console.error('🚨 ============================================');
      console.error(`🚨 Email: ${email}`);
      console.error('🚨');
      console.error('🚨 ⚠️  DO NOT USE PERSONAL EMAIL ACCOUNTS FOR SYSTEM EMAILS!');
      console.error('🚨');
      console.error('🚨 Reasons:');
      console.error('🚨   • Personal emails can receive spam/bounce notifications');
      console.error('🚨   • Security risk if account is compromised');
      console.error('🚨   • Violates email service provider policies');
      console.error('🚨   • Can lead to account suspension');
      console.error('🚨');
      console.error('🚨 ✅ SOLUTION: Use a dedicated business email account');
      console.error('🚨   Examples:');
      console.error('🚨   • noreply@yourdomain.com');
      console.error('🚨   • support@yourdomain.com');
      console.error('🚨   • notifications@yourdomain.com');
      console.error('🚨');
      console.error('🚨 Please update SMTP_USER in .env file immediately!');
      console.error('🚨 ============================================\n');
      
      // In production, you might want to throw an error instead
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'SECURITY ERROR: Personal email accounts cannot be used for system emails. ' +
          'Please use a dedicated business email account.'
        );
      }
      
      return false;
    }

    return true;
  }

  /**
   * Initialize email transporter with enhanced configuration
   */
  initializeTransporter() {
    try {
      // Validate required email configuration
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(
          '⚠️ Email configuration incomplete. SMTP_USER and SMTP_PASS required in .env file.'
        );
        return;
      }

      // ⚠️ SECURITY CHECK: Validate email is not a personal email
      if (!this.validateEmailConfig(process.env.SMTP_USER)) {
        console.error('❌ Email service initialization blocked due to personal email usage.');
        this.isConfigured = false;
        return;
      }

      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT) || 587;

      // Enhanced email configuration with App Password support
      const transportConfig = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS, // Should be App Password for Gmail/Outlook
        },
        tls: {
          rejectUnauthorized: false, // Accept self-signed certificates
        },
        debug: process.env.NODE_ENV === 'development', // Enable debug in development
        logger: process.env.NODE_ENV === 'development', // Enable logging in development
      };

      this.transporter = nodemailer.createTransport(transportConfig);
      this.isConfigured = true;

      console.log('📧 Email transporter initialized successfully');
      console.log(`📧 SMTP Host: ${smtpHost}`);
      console.log(`📧 SMTP Port: ${smtpPort}`);
      console.log(`📧 Configured email: ${process.env.SMTP_USER}`);
      console.log('📧 Ready to send emails with App Password authentication');
      console.log('✅ Email configuration validated - using business email account');
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Verify email server connection
   */
  async verifyConnection() {
    if (!this.transporter) {
      console.warn('⚠️ Email transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error.message);

      // Provide specific error guidance
      if (error.code === 'EAUTH') {
        console.error('🔐 Email Authentication Failed!');
        console.error('🔑 Ensure you\'re using an App Password, not your regular password');
        console.error('🔒 For Gmail: Verify 2-Factor Authentication is enabled');
        console.error('🔒 For Hotmail/Outlook: Check account security settings');
      } else if (error.code === 'ECONNECTION') {
        console.error('🌐 Connection Error - Check SMTP_HOST and SMTP_PORT settings');
      }

      return false;
    }
  }

  /**
   * Send email with comprehensive error handling and validation
   * @param {Object} mailOptions - Email options
   * @param {string} mailOptions.to - Recipient email address
   * @param {string} mailOptions.subject - Email subject
   * @param {string} mailOptions.text - Plain text content
   * @param {string} mailOptions.html - HTML content
   * @returns {Promise<Object>} - Email sending result
   */
  async sendMail(mailOptions) {
    try {
      // Validate transporter
      if (!this.isConfigured || !this.transporter) {
        throw new Error(
          'Email service not properly configured. Check SMTP_USER and SMTP_PASS in .env file.'
        );
      }

      // ⚠️ SECURITY CHECK: Re-validate email configuration before sending
      if (this.isPersonalEmail(process.env.SMTP_USER)) {
        throw new Error(
          'SECURITY ERROR: Cannot send emails using personal email account. ' +
          'Please use a dedicated business email account in SMTP_USER.'
        );
      }

      // Validate required mail options
      if (!mailOptions.to) {
        throw new Error('Recipient email address is required');
      }

      if (!mailOptions.subject) {
        throw new Error('Email subject is required');
      }

      if (!mailOptions.text && !mailOptions.html) {
        throw new Error('Email content (text or html) is required');
      }

      // Set default sender with enhanced headers for better deliverability
      const enhancedMailOptions = {
        from: `"Flower Shop" <${process.env.SMTP_USER}>`,
        replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_USER, // Reply-to address
        // Add headers to improve email deliverability
        headers: {
          'X-Mailer': 'Flower Shop Notification System',
          'X-Priority': '1', // Normal priority
          'List-Unsubscribe': process.env.FRONTEND_URL ? `<${process.env.FRONTEND_URL}/unsubscribe>` : undefined,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          ...mailOptions.headers, // Allow custom headers to override
        },
        // Add message ID for better tracking
        messageId: `<${Date.now()}-${Math.random().toString(36).substring(7)}@${process.env.SMTP_USER.split('@')[1] || 'flowershop.com'}>`,
        ...mailOptions,
      };
      
      // Remove undefined headers
      Object.keys(enhancedMailOptions.headers).forEach(key => {
        if (enhancedMailOptions.headers[key] === undefined) {
          delete enhancedMailOptions.headers[key];
        }
      });

      // Log email attempt (without sensitive data)
      console.log('📧 Sending email...');
      console.log(`📧 To: ${enhancedMailOptions.to}`);
      console.log(`📧 Subject: ${enhancedMailOptions.subject}`);

      // Send email with shorter timeout (10 seconds instead of 30)
      const result = await Promise.race([
        this.transporter.sendMail(enhancedMailOptions),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Email sending timeout after 10 seconds')),
            10000
          )
        ),
      ]);

      console.log('✅ Email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📧 Response: ${result.response}`);

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);

      // Provide specific error guidance
      this.handleEmailError(error);

      throw {
        success: false,
        error: error.message,
        code: error.code || 'EMAIL_SEND_ERROR',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Handle specific email errors with helpful guidance
   * @param {Error} error - The error object
   */
  handleEmailError(error) {
    if (error.code === 'EAUTH') {
      console.error('🔐 Email Authentication Error - Check your App Password');
      console.error('   Common causes:');
      console.error('   • Using regular password instead of App Password');
      console.error('   • App Password expired or revoked');
      console.error('   • Two-step verification not enabled');
      console.error('   • Incorrect email or password in .env file');
      console.error('   Solution: Generate a new App Password at https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Email Connection Error - Check internet connection and SMTP settings');
      console.error('   Common causes:');
      console.error('   • Incorrect SMTP_HOST or SMTP_PORT');
      console.error('   • Network connectivity issues');
      console.error('   • Firewall blocking SMTP port 587');
    } else if (error.code === 'EMESSAGE') {
      console.error('📝 Invalid email message format');
    } else if (error.responseCode === 554) {
      console.error('🚫 Email rejected - Check recipient and content');
    } else {
      console.error('   Unknown error type. Check error details above.');
    }
  }

  /**
   * Get email service status
   * @returns {Object} - Service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER,
      timestamp: new Date().toISOString(),
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

// Verify email address format and domain
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check for common invalid domains
  const invalidDomains = ['example.com', 'test.com', 'invalid.com'];
  const domain = email.split('@')[1]?.toLowerCase();

  if (invalidDomains.includes(domain)) {
    return false;
  }

  return true;
};

// Send activation email
const sendActivationEmail = async (email, name, activationCode) => {
  try {
    console.log(`Attempting to send activation email to: ${email}`);

    // Skip connection verification to reduce latency (connection is already verified at startup)
    // Only verify if transporter is not configured
    if (!emailService.isConfigured || !emailService.transporter) {
      const isConnected = await emailService.verifyConnection();
      if (!isConnected) {
        throw new Error('SMTP connection verification failed');
      }
    }

    // Create activation link - point directly to backend API
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
    const activationLink = `${backendUrl}/api/auth/activate?email=${encodeURIComponent(
      email
    )}&code=${activationCode}`;

    console.log('Activation link generated:', activationLink);

    // Send email
    const result = await emailService.sendMail({
      to: email,
      subject: 'Activate Your Flower Shop Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌸 Welcome to Flower Shop!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Thank you for registering with our flower shop! Please click the button below to activate your account:</p>
              <div style="text-align: center;">
                <a href="${activationLink}" class="button">Activate Account</a>
              </div>
              <p>Or copy and paste the following link into your browser:</p>
              <p style="word-break: break-all; color: #4CAF50;">${activationLink}</p>
              <p><strong>Important Notes:</strong></p>
              <ul>
                <li>This link is valid for 10 days</li>
                <li>If the link expires, please register again</li>
                <li>If you did not register this account, please ignore this email</li>
              </ul>
            </div>
            <div class="footer">
              <p>This email is automatically sent by the Flower Shop system. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Dear ${name},

        Thank you for registering with our flower shop! Please click the following link to activate your account:

        ${activationLink}

        This link is valid for 10 days.

        If you did not register this account, please ignore this email.

        This email is automatically sent by the Flower Shop system. Please do not reply.
      `,
    });

    return result;
  } catch (error) {
    console.error('❌ Error sending activation email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message || error.error);
    throw error;
  }
};

// Send reset password email
const sendResetPasswordEmail = async (email, name, resetCode) => {
  try {
    console.log(`Attempting to send reset password email to: ${email}`);
    console.log(`Email service configured: ${emailService.isConfigured}`);
    console.log(`Email service transporter exists: ${!!emailService.transporter}`);

    // Check if email service is configured
    if (!emailService.isConfigured || !emailService.transporter) {
      console.error('❌ Email service is not properly configured!');
      console.error('   Configured:', emailService.isConfigured);
      console.error('   Transporter exists:', !!emailService.transporter);
      console.error('   Please check SMTP configuration in .env file.');
      
      // Try to verify connection as a last resort
      const isConnected = await emailService.verifyConnection();
      if (!isConnected) {
        throw new Error('SMTP connection verification failed. Email service is not configured properly.');
      }
    }

    // Create reset password link with three parameters: email, resetCode, true
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(
      email
    )}&resetCode=${resetCode}&verified=true`;

    console.log('Reset password link generated:', resetLink);

    // Send email
    const result = await emailService.sendMail({
      to: email,
      subject: 'Reset Your Flower Shop Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #FF6B6B;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #FF6B6B;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>We received a request to reset your password. Please click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste the following link into your browser:</p>
              <p style="word-break: break-all; color: #FF6B6B;">${resetLink}</p>
              <div class="warning">
                <p><strong>Important Notes:</strong></p>
                <ul>
                  <li>This link is valid for 1 hour</li>
                  <li>If you did not request a password reset, please ignore this email</li>
                  <li>Your password will remain unchanged if you don't click the link</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>This email is automatically sent by the Flower Shop system. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Dear ${name},

        We received a request to reset your password. Please click the following link to reset your password:

        ${resetLink}

        This link is valid for 1 hour.

        If you did not request a password reset, please ignore this email.

        This email is automatically sent by the Flower Shop system. Please do not reply.
      `,
    });

    return result;
  } catch (error) {
    console.error('❌ Error sending reset password email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message || error.error);
    throw error;
  }
};

module.exports = {
  sendActivationEmail,
  sendResetPasswordEmail,
  isValidEmail,
  emailService,
  getEmailStatus: () => emailService.getStatus(),
};

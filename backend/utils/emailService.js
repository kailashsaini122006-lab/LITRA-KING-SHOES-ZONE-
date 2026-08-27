const nodemailer = require('nodemailer');
const dns = require('dns');

// Prioritize IPv4 on Windows to avoid IPv6 DNS timeout delays
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

// Default target recipient (can be updated via ADMIN_EMAIL in .env)
const DEFAULT_RECIPIENT = 'kailashsaini122006@gmail.com';

/**
 * Creates and returns a Nodemailer transporter based on .env config.
 */
function createTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  if (!user || !pass) {
    return null; // SMTP credentials not configured yet
  }

  const cleanPass = pass.replace(/\s+/g, '');

  if (host.includes('gmail') || user.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      family: 4,
      auth: { user, pass: cleanPass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    family: 4,
    auth: { user, pass: cleanPass },
  });
}

/**
 * Generates an organized, clean, modern HTML email template for the inquiry.
 */
function buildInquiryHtml({ name, phone, inquiryType, message, inquiryId, createdAt }) {
  const formattedDate = new Date(createdAt || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(
    `Hello ${name}, thank you for contacting Litra King Shoes Zone regarding your inquiry.`
  )}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry - Litra King Shoes Zone</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f11; font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f0f11; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-bottom: 2px solid #f59e0b; padding: 30px 25px; text-align: center;">
              <h1 style="margin: 0; color: #f59e0b; font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                👑 LITRA KING <span style="color: #ffffff;">(SHOES ZONE)</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #a1a1aa; font-size: 13px; letter-spacing: 0.5px;">
                New Customer Website Inquiry Received
              </p>
            </td>
          </tr>

          <!-- Inquiry Type Tag -->
          <tr>
            <td style="padding: 24px 30px 10px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #451a03; color: #fbbf24; border: 1px solid #d97706; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                      📋 ${inquiryType}
                    </span>
                  </td>
                  <td align="right" style="color: #71717a; font-size: 12px;">
                    ${formattedDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Details Card -->
          <tr>
            <td style="padding: 15px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #27272a; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 12px; color: #a1a1aa; font-size: 13px; width: 35%; font-weight: 600;">Customer Name:</td>
                  <td style="padding: 8px 12px; color: #ffffff; font-size: 15px; font-weight: 700;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #a1a1aa; font-size: 13px; font-weight: 600; border-top: 1px solid #3f3f46;">Phone Number:</td>
                  <td style="padding: 8px 12px; color: #fbbf24; font-size: 16px; font-weight: 800; border-top: 1px solid #3f3f46;">
                    <a href="tel:${phone}" style="color: #fbbf24; text-decoration: none;">+91 ${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #a1a1aa; font-size: 13px; font-weight: 600; border-top: 1px solid #3f3f46;">Inquiry ID:</td>
                  <td style="padding: 8px 12px; color: #a1a1aa; font-size: 12px; font-family: monospace; border-top: 1px solid #3f3f46;">
                    ${inquiryId || 'N/A'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Section -->
          <tr>
            <td style="padding: 10px 30px 20px 30px;">
              <p style="margin: 0 0 8px 0; color: #d4d4d8; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                Customer Message & Requirements:
              </p>
              <div style="background-color: #09090b; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; color: #f4f4f5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                ${message}
              </div>
            </td>
          </tr>

          <!-- Quick Action Buttons -->
          <tr>
            <td style="padding: 10px 30px 30px 30px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="tel:${phone}" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 22px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                      📞 Call Customer
                    </a>
                  </td>
                  <td>
                    <a href="${waUrl}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 22px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                      💬 Chat on WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #09090b; border-top: 1px solid #27272a; padding: 18px 30px; text-align: center; color: #71717a; font-size: 12px;">
              Litra King (Shoes Zone) • Chomu, Rajasthan, India<br>
              Direct Wholesale & Retail Footwear Support: 9257575393
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends inquiry notification email to the configured admin address.
 */
async function sendInquiryEmail(inquiry) {
  const recipient = process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT;
  const transporter = createTransporter();

  const htmlContent = buildInquiryHtml({
    name: inquiry.name,
    phone: inquiry.phone,
    inquiryType: inquiry.inquiryType,
    message: inquiry.message,
    inquiryId: inquiry._id,
    createdAt: inquiry.createdAt,
  });

  const plainText = `
New Inquiry Received for Litra King (Shoes Zone)
-----------------------------------------------
Type: ${inquiry.inquiryType}
Customer Name: ${inquiry.name}
Phone: +91 ${inquiry.phone}
Date: ${new Date(inquiry.createdAt || Date.now()).toLocaleString('en-IN')}

Message:
${inquiry.message}

Quick Actions:
- Call: tel:${inquiry.phone}
- WhatsApp: https://wa.me/91${inquiry.phone}
  `.trim();

  if (!transporter) {
    console.log('\n📧 [Email Notification - Simulated (SMTP credentials not yet configured in .env)]');
    console.log(`To: ${recipient}`);
    console.log(`Subject: 👑 New [${inquiry.inquiryType}] from ${inquiry.name} (${inquiry.phone})`);
    console.log(plainText);
    console.log('--------------------------------------------------\n');
    return { success: true, simulated: true };
  }

  try {
    const sender = process.env.SMTP_FROM || process.env.SMTP_USER || 'Litra King Shoes Zone <no-reply@litraking.com>';
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: `👑 New [${inquiry.inquiryType}] from ${inquiry.name} (${inquiry.phone})`,
      text: plainText,
      html: htmlContent,
    });

    console.log(`✅ [EmailService] Inquiry email successfully sent to ${recipient}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [EmailService] Error sending email via SMTP:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends security alert email to configured admin on unauthorized face scan or wrong password attempts.
 */
async function sendSecurityAlertEmail({ attemptType, ipAddress, userAgent, time, details }) {
  const recipient = process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT;
  const transporter = createTransporter();

  const formattedDate = new Date(time || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const alertTitle = '🚨 WRONG PASSWORD ATTEMPT';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Alert - Litra King Shoes Zone</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f11; font-family: 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f0f11; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background: #18181b; border: 2px solid #ef4444; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(239, 68, 68, 0.2);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #7f1d1d 0%, #18181b 100%); border-bottom: 2px solid #ef4444; padding: 30px 25px; text-align: center;">
              <h1 style="margin: 0; color: #fca5a5; font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                ${alertTitle}
              </h1>
              <p style="margin: 6px 0 0 0; color: #f87171; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
                SECURITY WARNING: UNAUTHORIZED DATA ADD ACCESS ATTEMPT
              </p>
            </td>
          </tr>

          <!-- Alert Details -->
          <tr>
            <td style="padding: 24px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #27272a; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 12px; color: #a1a1aa; font-size: 13px; font-weight: 600; width: 35%;">Failed Attempt Time:</td>
                  <td style="padding: 8px 12px; color: #ffffff; font-size: 14px; font-weight: 700;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #a1a1aa; font-size: 13px; font-weight: 600; border-top: 1px solid #3f3f46;">Attempt Type:</td>
                  <td style="padding: 8px 12px; color: #ef4444; font-size: 15px; font-weight: 800; border-top: 1px solid #3f3f46;">
                    Wrong Password Input
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #a1a1aa; font-size: 13px; font-weight: 600; border-top: 1px solid #3f3f46;">IP Address:</td>
                  <td style="padding: 8px 12px; color: #fbbf24; font-size: 14px; font-weight: 700; font-family: monospace; border-top: 1px solid #3f3f46;">
                    ${ipAddress || 'Unknown IP'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #a1a1aa; font-size: 13px; font-weight: 600; border-top: 1px solid #3f3f46;">Browser / Device Info:</td>
                  <td style="padding: 8px 12px; color: #d4d4d8; font-size: 12px; font-family: monospace; border-top: 1px solid #3f3f46; word-break: break-all;">
                    ${userAgent || 'Not available'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Warning Box -->
          <tr>
            <td style="padding: 0 30px 24px 30px;">
              <div style="background-color: #450a0a; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px 20px; color: #fecaca; font-size: 13px; line-height: 1.6;">
                <strong>🚨 Security Alert Message:</strong><br>
                ${details || 'An incorrect password entry was blocked while attempting to access your website registration/data entry portal. Access has been denied.'}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #09090b; border-top: 1px solid #27272a; padding: 18px 30px; text-align: center; color: #71717a; font-size: 12px;">
              Litra King Shoes Zone • Automated Security Monitoring System
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const plainText = `
🚨 SECURITY ALERT: UNAUTHORIZED ACCESS ATTEMPT DETECTED
------------------------------------------------------
Attempt Type: Wrong Password
Date & Time: ${formattedDate}
IP Address: ${ipAddress || 'Unknown'}
Browser/Device: ${userAgent || 'Unknown'}

Warning: ${details || 'An incorrect password attempt was blocked.'}
  `.trim();

  if (!transporter) {
    console.log('\n🚨 [Security Alert Email - Simulated (SMTP credentials not yet set in .env)]');
    console.log(`To: ${recipient}`);
    console.log(`Subject: 🚨 SECURITY ALERT: ${alertTitle} on Litra King Website`);
    console.log(plainText);
    console.log('--------------------------------------------------\n');
    return { success: true, simulated: true };
  }

  try {
    const sender = process.env.SMTP_FROM || process.env.SMTP_USER || 'Litra King Security <no-reply@litraking.com>';
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: `🚨 SECURITY ALERT: ${alertTitle} on Litra King Website`,
      text: plainText,
      html: htmlContent,
    });
    console.log(`✅ [Security Alert] Email sent to ${recipient}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ [Security Alert] Failed to send email via SMTP:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends Password Reset OTP email to configured admin / requested email.
 */
async function sendPasswordResetEmail({ email, otp }) {
  const recipient = email || process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT;
  const transporter = createTransporter();

  const formattedDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Reset OTP - Litra King Shoes Zone</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f11; font-family: 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f0f11; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background: #18181b; border: 1px solid #f59e0b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-bottom: 2px solid #f59e0b; padding: 30px 25px; text-align: center;">
              <h1 style="margin: 0; color: #f59e0b; font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                👑 LITRA KING <span style="color: #ffffff;">(SHOES ZONE)</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #a1a1aa; font-size: 13px; letter-spacing: 0.5px;">
                Password Reset Verification OTP Code
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #d4d4d8; font-size: 14px;">
                Use the following 6-digit OTP code to reset your account password. This OTP is valid for <strong>10 minutes</strong>.
              </p>
              <div style="display: inline-block; background-color: #09090b; border: 2px dashed #f59e0b; border-radius: 12px; padding: 18px 36px; margin: 15px 0;">
                <span style="color: #fbbf24; font-size: 36px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">
                  ${otp}
                </span>
              </div>
              <p style="margin: 15px 0 0 0; color: #71717a; font-size: 12px;">
                Request Date & Time: ${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding: 0 30px 24px 30px;">
              <div style="background-color: #27272a; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; color: #a1a1aa; font-size: 13px; line-height: 1.5;">
                🔒 <strong>Security Warning:</strong> If you did not request a password reset, please ignore this email. Do not share this OTP code with anyone.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #09090b; border-top: 1px solid #27272a; padding: 18px 30px; text-align: center; color: #71717a; font-size: 12px;">
              Litra King Shoes Zone • Chomu, Rajasthan, India
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const plainText = `
Litra King Shoes Zone - Password Reset OTP
------------------------------------------
Your 6-digit Password Reset OTP is: ${otp}

This OTP is valid for 10 minutes.
Date: ${formattedDate}

If you did not request a password reset, please ignore this email.
  `.trim();

  if (!transporter) {
    console.log('\n📧 [Password Reset OTP - Simulated (SMTP credentials not yet set in .env)]');
    console.log(`To: ${recipient}`);
    console.log(`Subject: 🔑 Password Reset OTP Code: ${otp} (Litra King Shoes Zone)`);
    console.log(plainText);
    console.log('--------------------------------------------------\n');
    return { success: true, simulated: true };
  }

  try {
    const sender = process.env.SMTP_FROM || process.env.SMTP_USER || 'Litra King Security <no-reply@litraking.com>';
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: `🔑 Password Reset OTP Code: ${otp} (Litra King Shoes Zone)`,
      text: plainText,
      html: htmlContent,
    });
    console.log(`✅ [Password Reset] OTP email sent to ${recipient}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ [Password Reset] Failed to send OTP email via SMTP:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendInquiryEmail,
  sendSecurityAlertEmail,
  sendPasswordResetEmail,
  DEFAULT_RECIPIENT,
};



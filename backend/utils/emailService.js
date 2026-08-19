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

module.exports = {
  sendInquiryEmail,
  DEFAULT_RECIPIENT,
};

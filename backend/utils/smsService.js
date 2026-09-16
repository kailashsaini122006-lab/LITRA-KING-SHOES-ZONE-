/**
 * Litra King Shoes Zone - Fast2SMS & SMS Gateway Service
 * Configurable support for Fast2SMS (India), Twilio, and MSG91.
 */

/**
 * Send Delivery Verification OTP via SMS
 */
async function sendDeliveryOtpSms({ phone, otp, orderId }) {
  const cleanPhone = (phone || '').toString().replace(/\D/g, '');
  const targetPhone = cleanPhone.length === 10 ? cleanPhone : cleanPhone.slice(-10);

  if (!targetPhone || targetPhone.length !== 10) {
    const errorMsg = `Invalid customer mobile phone number "${phone}". Must be a valid 10-digit Indian phone number.`;
    console.error(`❌ [SMS Gateway Error] Order #${orderId} | ${errorMsg}`);
    return {
      success: false,
      liveSmsSent: false,
      provider: 'None',
      error: errorMsg,
    };
  }

  const messageText = `Your Litra King Shoes Zone Delivery OTP for Order #${orderId} is ${otp}. Please share this OTP with the delivery executive upon receiving your order. Valid for 10 mins.`;

  console.log(`📱 [SMS Gateway Request] Order #${orderId} | Target Mobile: +91 ${targetPhone} | OTP: ${otp}`);

  const gateway = (process.env.SMS_GATEWAY || '').toLowerCase();
  const fast2smsKey = (process.env.FAST2SMS_API_KEY || '').trim();
  const twilioSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const twilioAuth = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioFrom = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const msg91Key = (process.env.MSG91_AUTH_KEY || '').trim();

  const isFast2smsValid = fast2smsKey && !fast2smsKey.includes('YOUR_') && !fast2smsKey.includes('placeholder');
  const isTwilioValid = twilioSid && twilioAuth && !twilioSid.includes('placeholder');
  const isMsg91Valid = msg91Key && !msg91Key.includes('placeholder');

  let attemptedProvider = false;
  let providerError = null;

  // 1. Fast2SMS Integration (Primary Gateway for Indian OTPs)
  if (gateway === 'fast2sms' || isFast2smsValid) {
    attemptedProvider = true;
    if (!isFast2smsValid) {
      providerError = 'FAST2SMS_API_KEY is not configured or contains placeholder text in backend/.env.';
    } else {
      try {
        console.log(`📡 [Fast2SMS API Request] Sending 6-digit OTP to +91 ${targetPhone}...`);
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: targetPhone,
          }),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data && (data.return === true || data.status_code === 200)) {
          console.log(`✅ [Fast2SMS Confirmed Delivery] Order #${orderId} | OTP sent successfully to +91 ${targetPhone}`);
          return {
            success: true,
            liveSmsSent: true,
            provider: 'Fast2SMS',
            data,
            message: `Delivery OTP successfully sent via Fast2SMS to +91 ${targetPhone}`,
          };
        } else {
          const rawMsg = data?.message;
          const errMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || `HTTP Status ${response.status}`);
          console.error(`❌ [Fast2SMS API Error] Order #${orderId} | Gateway Rejection: ${errMsg}`);
          providerError = `Fast2SMS Gateway Error: ${errMsg}`;
        }
      } catch (err) {
        console.error(`❌ [Fast2SMS Exception] Order #${orderId} | ${err.message}`);
        providerError = `Fast2SMS Network Exception: ${err.message}`;
      }
    }
  }

  // 2. Twilio SMS Integration
  if (!attemptedProvider && (gateway === 'twilio' || isTwilioValid)) {
    attemptedProvider = true;
    if (!isTwilioValid) {
      providerError = 'Twilio credentials are missing in backend/.env.';
    } else {
      try {
        console.log(`📡 [Twilio API Request] Sending OTP to +91 ${targetPhone}...`);
        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const twilioPhone = targetPhone.startsWith('+') ? targetPhone : `+91${targetPhone}`;

        const params = new URLSearchParams();
        params.append('To', twilioPhone);
        params.append('From', twilioFrom || '+1234567890');
        params.append('Body', messageText);

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data && data.sid) {
          console.log(`✅ [Twilio Confirmed Delivery] Order #${orderId} | OTP delivered to ${twilioPhone}`);
          return {
            success: true,
            liveSmsSent: true,
            provider: 'Twilio',
            data,
            message: `Delivery OTP sent via Twilio to ${twilioPhone}`,
          };
        } else {
          const errMsg = data?.message || `Twilio Error Code ${data?.code || response.status}`;
          console.error(`❌ [Twilio API Error] Order #${orderId} | Gateway Rejection: ${errMsg}`);
          providerError = `Twilio Gateway Error: ${errMsg}`;
        }
      } catch (err) {
        console.error(`❌ [Twilio Exception] Order #${orderId} | ${err.message}`);
        providerError = `Twilio Network Exception: ${err.message}`;
      }
    }
  }

  // 3. MSG91 Integration
  if (!attemptedProvider && (gateway === 'msg91' || isMsg91Valid)) {
    attemptedProvider = true;
    if (!isMsg91Valid) {
      providerError = 'MSG91 credentials are missing in backend/.env.';
    } else {
      try {
        console.log(`📡 [MSG91 API Request] Sending OTP to +91 ${targetPhone}...`);
        const response = await fetch('https://control.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: {
            authkey: msg91Key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mobile: `91${targetPhone}`,
            otp,
            template_id: process.env.MSG91_DLT_TE_ID || '',
          }),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data && data.type === 'success') {
          console.log(`✅ [MSG91 Confirmed Delivery] Order #${orderId} | OTP delivered to +91 ${targetPhone}`);
          return {
            success: true,
            liveSmsSent: true,
            provider: 'MSG91',
            data,
            message: `Delivery OTP sent via MSG91 to +91 ${targetPhone}`,
          };
        } else {
          const errMsg = data?.message || `MSG91 Error (HTTP Status ${response.status})`;
          console.error(`❌ [MSG91 API Error] Order #${orderId} | Gateway Rejection: ${errMsg}`);
          providerError = `MSG91 Gateway Error: ${errMsg}`;
        }
      } catch (err) {
        console.error(`❌ [MSG91 Exception] Order #${orderId} | ${err.message}`);
        providerError = `MSG91 Network Exception: ${err.message}`;
      }
    }
  }

  // If a provider was attempted or configured, but failed:
  if (attemptedProvider && providerError) {
    console.error(`❌ [SMS Dispatch Failed] Order #${orderId} | ${providerError}`);
    return {
      success: false,
      liveSmsSent: false,
      provider: gateway || 'Fast2SMS',
      error: providerError,
    };
  }

  // 4. Default if no SMS Gateway API key is in backend/.env
  const configError = 'SMS Gateway API Key is not configured in backend/.env. Please add FAST2SMS_API_KEY=your_key in backend/.env to send SMS.';
  console.error(`❌ [SMS Config Missing] Order #${orderId} | ${configError}`);

  return {
    success: false,
    liveSmsSent: false,
    provider: 'None',
    error: configError,
  };
}

module.exports = {
  sendDeliveryOtpSms,
};

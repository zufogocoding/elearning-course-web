const dns = require('dns');

// Force IPv4 resolution first to bypass IPv6 routing issues on host environments (e.g. Render)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const nodemailer = require('nodemailer');


/**
 * Email Service
 *
 * Hỗ trợ 2 mode:
 * 1. Production: Dùng SMTP thật (Gmail, Resend, SendGrid, ...)
 * 2. Development: Dùng Ethereal (fake SMTP, xem email tại https://ethereal.email)
 *
 * Cấu hình qua biến môi trường trong .env
 */

let transporter = null;

/**
 * Khởi tạo transporter (gọi 1 lần khi server start)
 */
const initEmailTransporter = async () => {
  if (process.env.SMTP_HOST) {
    const originalHost = process.env.SMTP_HOST;
    let host = originalHost;
    let tlsConfig = {};

    // For IPv4 / IPv6 dual-stack environments where IPv6 outbound routing is broken (e.g. Render),
    // we resolve the SMTP host to IPv4 explicitly to force IPv4 connection.
    try {
      const addresses = await dns.promises.resolve4(originalHost);
      if (addresses && addresses.length > 0) {
        host = addresses[0];
        tlsConfig = {
          servername: originalHost
        };
        console.log(`📧 Resolved SMTP host ${originalHost} to IPv4: ${host}`);
      }
    } catch (dnsErr) {
      console.warn(`⚠️ DNS IPv4 resolution failed for ${originalHost}, using hostname directly:`, dnsErr.message);
    }

    // Production mode: dùng SMTP thật
    transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true cho port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: tlsConfig,
    });
    console.log(`📧 Email service: SMTP (${originalHost})`);
  } else {
    // Development mode: dùng Ethereal (fake inbox)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`📧 Email service: Ethereal (dev mode)`);
    console.log(`   Preview URL: https://ethereal.email/login`);
    console.log(`   User: ${testAccount.user}`);
  }
};

/**
 * Gửi email reset mật khẩu
 * @param {string} to - Email người nhận
 * @param {string} resetToken - Token reset password
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  if (!transporter) {
    await initEmailTransporter();
  }

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"LMS Platform" <noreply@lms.local>',
    to,
    subject: 'Đặt lại mật khẩu - LMS Platform',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Nhấn vào nút bên dưới để đặt mật khẩu mới:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background: #6c63ff; color: white; 
                  padding: 12px 24px; border-radius: 6px; text-decoration: none; 
                  font-weight: 600; margin: 16px 0;">
          Đặt lại mật khẩu
        </a>
        <p style="color: #666; font-size: 14px;">
          Link này sẽ hết hạn sau <strong>1 giờ</strong>.
        </p>
        <p style="color: #999; font-size: 12px;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  // Trong dev mode, in ra URL preview email
  if (!process.env.SMTP_HOST) {
    console.log(`📧 Preview email: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
};

/**
 * Gửi OTP xác thực email khi đăng ký
 * ALWAYS logs OTP to console as fallback (for grading/dev without SMTP)
 */
const sendEmailVerificationOtp = async (to, otp) => {
  // Log OTP for dev/grading fallback (never in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🔑 [EMAIL VERIFY OTP] Email: ${to} | OTP: ${otp}\n`);
  }

  if (!transporter) {
    try { await initEmailTransporter(); } catch(e) { return; }
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Elevate LMS" <noreply@elevate.local>',
    to,
    subject: 'Xác thực tài khoản – Mã OTP của bạn',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0d0f1a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Elevate</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Xác thực tài khoản của bạn</p>
        </div>
        <div style="padding: 32px; background: #1a1d2e;">
          <p style="color: #e2e8f0; margin: 0 0 16px;">Mã OTP xác thực email của bạn là:</p>
          <div style="background: #0d0f1a; border: 2px solid #4F46E5; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #818CF8; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #7a87a1; font-size: 14px;">Mã có hiệu lực trong <strong style="color: #e2e8f0;">10 phút</strong>.</p>
          <p style="color: #7a87a1; font-size: 12px; margin-top: 24px;">Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (!process.env.SMTP_HOST) {
      console.log(`📧 Preview: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch(e) {
    console.error('Email send error (OTP still logged above):', e.message);
  }
};

/**
 * Gửi OTP reset mật khẩu
 * ALWAYS logs OTP to console as fallback
 */
const sendPasswordResetOtp = async (to, otp) => {
  // Log OTP for dev/grading fallback (never in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🔑 [RESET PASSWORD OTP] Email: ${to} | OTP: ${otp}\n`);
  }

  if (!transporter) {
    try { await initEmailTransporter(); } catch(e) { return; }
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Elevate LMS" <noreply@elevate.local>',
    to,
    subject: 'Đặt lại mật khẩu – Mã OTP của bạn',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0d0f1a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Elevate</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Đặt lại mật khẩu</p>
        </div>
        <div style="padding: 32px; background: #1a1d2e;">
          <p style="color: #e2e8f0; margin: 0 0 16px;">Mã OTP để đặt lại mật khẩu của bạn là:</p>
          <div style="background: #0d0f1a; border: 2px solid #4F46E5; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #818CF8; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #7a87a1; font-size: 14px;">Mã có hiệu lực trong <strong style="color: #e2e8f0;">10 phút</strong>.</p>
          <p style="color: #7a87a1; font-size: 12px; margin-top: 24px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (!process.env.SMTP_HOST) {
      console.log(`📧 Preview: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch(e) {
    console.error('Email send error (OTP still logged above):', e.message);
  }
};

module.exports = {
  initEmailTransporter,
  sendPasswordResetEmail,
  sendEmailVerificationOtp,
  sendPasswordResetOtp,
};

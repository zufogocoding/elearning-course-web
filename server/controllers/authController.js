const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { generateTokens, verifyRefreshToken, JWT_ACCESS_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail, sendEmailVerificationOtp, sendPasswordResetOtp } = require('../lib/email');

const SALT_ROUNDS = 12;
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'reset-token-secret-dev';

/** Generate a 6-digit OTP string */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/** SHA-256 hash of a string */
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const useSecureCookies = process.env.NODE_ENV === 'production' || 
                         (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'));

/** Set refresh token cookie */
const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: useSecureCookies ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

// ============================================
// POST /auth/register
// Creates user (inactive), sends email OTP
// ============================================
const register = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: email, username, password' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        isActive: false, // Requires email verification
      },
      select: { id: true, email: true, username: true, role: true },
    });

    // Generate and store OTP
    const otp = generateOtp();
    await prisma.emailVerificationOtp.create({
      data: {
        userId: user.id,
        otp: hashOtp(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send OTP (also logs to console as fallback)
    sendEmailVerificationOtp(email, otp).catch(console.error);

    res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP xác thực.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email hoặc username đã tồn tại' });
    }
    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
};

// ============================================
// POST /auth/verify-email
// Verifies OTP, activates user, auto-login
// ============================================
const verifyEmailOtp = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ error: 'Thiếu userId hoặc otp' });
  }

  try {
    const otpRecord = await prisma.emailVerificationOtp.findFirst({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Không tìm thấy OTP. Vui lòng đăng ký lại.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await prisma.emailVerificationOtp.deleteMany({ where: { userId: parseInt(userId) } });
      return res.status(400).json({ error: 'OTP đã hết hạn. Vui lòng yêu cầu gửi lại.', code: 'OTP_EXPIRED' });
    }

    if (otpRecord.otp !== hashOtp(otp)) {
      return res.status(400).json({ error: 'Mã OTP không đúng' });
    }

    // Activate user, clear OTP
    const user = await prisma.$transaction(async (tx) => {
      await tx.emailVerificationOtp.deleteMany({ where: { userId: parseInt(userId) } });
      return tx.user.update({
        where: { id: parseInt(userId) },
        data: { emailVerifiedAt: new Date(), isActive: true },
        select: { id: true, email: true, username: true, role: true, avatarUrl: true },
      });
    });

    // Auto-login: generate tokens
    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    setRefreshCookie(res, tokens.refreshToken);

    res.status(200).json({
      message: 'Xác thực email thành công!',
      user,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Lỗi verify email OTP:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// POST /auth/resend-otp
// Resend email verification OTP
// ============================================
const resendEmailOtp = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Thiếu userId' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, email: true, emailVerifiedAt: true, isActive: true },
    });

    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    if (user.emailVerifiedAt) return res.status(400).json({ error: 'Email đã được xác thực' });

    // Rate limit: check if last OTP was sent less than 60 seconds ago
    const lastOtp = await prisma.emailVerificationOtp.findFirst({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const secondsAgo = (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
      if (secondsAgo < 60) {
        return res.status(429).json({
          error: `Vui lòng đợi ${Math.ceil(60 - secondsAgo)} giây trước khi gửi lại`,
          retryAfter: Math.ceil(60 - secondsAgo),
        });
      }
      await prisma.emailVerificationOtp.deleteMany({ where: { userId: parseInt(userId) } });
    }

    const otp = generateOtp();
    await prisma.emailVerificationOtp.create({
      data: {
        userId: parseInt(userId),
        otp: hashOtp(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    sendEmailVerificationOtp(user.email, otp).catch(console.error);

    res.status(200).json({ message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.' });
  } catch (error) {
    console.error('Lỗi resend OTP:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// POST /auth/login
// ============================================
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Thiếu email hoặc password' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, username: true, role: true,
        passwordHash: true, isActive: true, deletedAt: true,
        emailVerifiedAt: true, avatarUrl: true,
      },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    if (!user.isActive) {
      // Check if it's because email not verified
      if (!user.emailVerifiedAt) {
        return res.status(403).json({
          error: 'Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    setRefreshCookie(res, tokens.refreshToken);

    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: { id: user.id, email: user.email, username: user.username, role: user.role, avatarUrl: user.avatarUrl },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};

// ============================================
// POST /auth/refresh
// ============================================
const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Không tìm thấy refresh token' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user || user.deletedAt || !user.isActive) {
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({ error: 'Tài khoản không hợp lệ' });
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    setRefreshCookie(res, tokens.refreshToken);

    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error) {
    console.error('Lỗi refresh token:', error);
    res.clearCookie('refreshToken', { path: '/' });
    return res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
};

// ============================================
// POST /auth/logout
// ============================================
const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: useSecureCookies ? 'none' : 'lax',
    path: '/',
  });
  res.status(200).json({ message: 'Đăng xuất thành công' });
};

// ============================================
// POST /auth/forgot-password
// Sends 6-digit OTP instead of reset link
// ============================================
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Vui lòng nhập email' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true, deletedAt: true },
    });

    // Always same response to prevent enumeration
    const genericResponse = { message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP trong vài giây.' };

    if (!user || user.deletedAt || !user.isActive) {
      return res.status(200).json(genericResponse);
    }

    // Delete old reset tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate 6-digit OTP and hash it
    const otp = generateOtp();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashOtp(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send OTP (logs to console as fallback)
    sendPasswordResetOtp(email, otp).catch(console.error);

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Lỗi forgot password:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// POST /auth/verify-reset-otp
// Validates OTP, returns short-lived resetToken JWT
// ============================================
const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Thiếu email hoặc otp' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return res.status(400).json({ error: 'OTP không hợp lệ' });
    }

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, token: hashOtp(otp) },
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Mã OTP không đúng' });
    }

    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      return res.status(400).json({ error: 'OTP đã hết hạn. Vui lòng yêu cầu lại.', code: 'OTP_EXPIRED' });
    }

    // OTP valid - delete it and issue a short-lived resetToken JWT
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password_reset' },
      RESET_TOKEN_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      message: 'OTP hợp lệ',
      resetToken,
    });
  } catch (error) {
    console.error('Lỗi verify reset OTP:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// POST /auth/reset-password
// Uses resetToken JWT to set new password
// ============================================
const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: 'Thiếu resetToken hoặc mật khẩu mới' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(resetToken, RESET_TOKEN_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Token không hợp lệ' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash },
    });

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' });
  } catch (error) {
    console.error('Lỗi reset password:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ============================================
// POST /auth/dev-auto-login
// Server-side admin auto-login for dev environments only.
// Credentials are read from server-side env vars, NOT exposed in client bundle.
// ============================================
const devAutoLogin = async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Chỉ khả dụng trong môi trường development.' });
  }

  const devEmail = process.env.DEV_ADMIN_EMAIL;
  const devPassword = process.env.DEV_ADMIN_PASSWORD;

  if (!devEmail || !devPassword) {
    return res.status(400).json({ error: 'Chưa cấu hình tài khoản dev (DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD)' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: devEmail },
      select: {
        id: true, email: true, username: true, role: true,
        passwordHash: true, isActive: true, deletedAt: true,
        avatarUrl: true,
      },
    });

    if (!user || user.deletedAt || !user.isActive || user.role !== 'admin') {
      return res.status(401).json({ error: 'Tài khoản admin dev không tồn tại hoặc không hợp lệ.' });
    }

    const isPasswordValid = await bcrypt.compare(devPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mật khẩu admin dev không đúng với database.' });
    }

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
    setRefreshCookie(res, tokens.refreshToken);

    return res.status(200).json({
      message: 'Dev auto-login thành công',
      user: { id: user.id, email: user.email, username: user.username, role: user.role, avatarUrl: user.avatarUrl },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Lỗi dev auto-login:', error);
    return res.status(500).json({ error: 'Lỗi server khi dev auto-login' });
  }
};
module.exports = {
  register,
  verifyEmailOtp,
  resendEmailOtp,
  devAutoLogin,
  login,
  refresh,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};

const jwt = require('jsonwebtoken');

// MUST match the secret in auth.js (JWT_ACCESS_SECRET)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_ACCESS_SECRET) {
  console.error('❌ LỖI NGHIÊM TRỌNG: Thiếu biến môi trường JWT_ACCESS_SECRET trong file .env');
  process.exit(1); // Dừng hệ thống ngay lập tức
}

// Middleware xác thực User (Kiểm tra xem đã đăng nhập chưa)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Từ chối truy cập: Vui lòng đăng nhập!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Giải mã token dùng chung JWT_ACCESS_SECRET với auth.js
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// Middleware kiểm tra quyền Admin
// PHẢI chạy sau verifyToken
const verifyAdmin = (req, res, next) => {
  // Lấy role từ thông tin user đã được giải mã ở bước verifyToken
  const role = req.user?.role;

  // Đối chiếu với schema: role của Admin mặc định có thể là "admin"
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Chỉ Quản trị viên (Admin) mới có quyền thực hiện hành động này!' });
  }

  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
};
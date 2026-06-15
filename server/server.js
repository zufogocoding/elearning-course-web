require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { initEmailTransporter } = require('./lib/email');
const errorHandler = require('./middleware/errorMiddleware');
const { startCronJobs } = require('./lib/cronJobs');



// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes'); 
const adminRoutes = require('./routes/adminRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const courseContentRoutes = require('./routes/courseContentRoutes');
const videoRoutes = require('./routes/videoRoutes');
const learningRoutes = require('./routes/learningRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 10000, // limit each IP to 200 requests in prod, 10000 in dev
  message: { success: false, error: 'Quá nhiều request từ IP này, vui lòng thử lại sau.' }
});

// Middleware
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Serve static uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server đang chạy' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/content', courseContentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/learning', learningRoutes);

// Global Error Handler (MUST BE THE LAST MIDDLEWARE)
app.use(errorHandler);

// Khởi động server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Backend REST API đang chạy tại http://0.0.0.0:${PORT}`);
  try {
    await initEmailTransporter();
    startCronJobs();
  } catch (error) {
    console.error('Lỗi khi khởi tạo email service:', error);
  }
});

// Mở endpoint phục vụ file (Chỉ trả về file tĩnh, không thực thi)
app.use('/api/files', express.static(path.join(__dirname, '../storage/uploads'), {
  fallthrough: false,
  setHeaders: (res, filePath) => {
    // Ép trình duyệt không được chạy file nội dung lạ (Bảo mật thêm 1 lớp XSS)
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));
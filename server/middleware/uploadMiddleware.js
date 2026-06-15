const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 1. Cấu hình lưu file tạm vào RAM (Memory Storage) 
// Tuyệt đối chưa ghi ra ổ cứng khi chưa kiểm tra xong
const storage = multer.memoryStorage();

// 2. Cấu hình Multer cơ bản (Lọc lớp 1: Chặn theo Extension & Kích thước)
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // Giới hạn max 5MB/file để chống DDOS ổ cứng
  },
  fileFilter: (req, file, cb) => {
    // Lọc sơ bộ qua mimetype do trình duyệt gửi lên
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép định dạng ảnh JPG, PNG, WEBP.'));
    }
  }
});

// 3. Middleware Kiểm tra "Ruột" File (Lọc lớp 2: Quét Magic Numbers)
const validateActualFileType = async (req, res, next) => {
  if (!req.file) return next(); // Nếu không có file tải lên thì bỏ qua

  try {
    // Dynamic import cho thư viện file-type (vì nó là ESM)
    const { fileTypeFromBuffer } = await import('file-type');

    // Đọc các byte đầu tiên (Magic bytes) của file để xác định định dạng gốc
    const actualType = await fileTypeFromBuffer(req.file.buffer);

    // Danh sách các chuẩn file thực tế được phép
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!actualType || !validMimes.includes(actualType.mime)) {
      return res.status(400).json({ 
        error: 'Cảnh báo an ninh: Định dạng file bị làm giả! Hãy tải lên một file ảnh thật.' 
      });
    }

    // 4. LƯU FILE AN TOÀN (Ngoài Document Root)
    // Đảm bảo thư mục server/storage/uploads đã được tạo sẵn
    const uploadDir = path.join(__dirname, '../../storage/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Đổi tên file ngẫu nhiên hoàn toàn để tránh Path Traversal và giấu tên file gốc
    const safeFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${actualType.ext}`;
    const destinationPath = path.join(uploadDir, safeFileName);

    // Ghi file từ RAM ra ổ đĩa
    fs.writeFileSync(destinationPath, req.file.buffer);

    // Gắn đường dẫn an toàn vào req để Controller dùng lưu vào Database
    req.file.safeUrl = `/api/files/${safeFileName}`; 
    
    next();
  } catch (error) {
    console.error('Lỗi khi quét file:', error);
    res.status(500).json({ error: 'Lỗi server khi xử lý file tải lên.' });
  }
};

module.exports = {
  // Xuất ra dạng mảng để gọi chuỗi middleware dễ dàng
  uploadImage: [upload.single('file'), validateActualFileType]
};
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.memoryStorage();

// ==========================================
// 1. IMAGE UPLOAD
// ==========================================
const uploadImageMw = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép định dạng ảnh JPG, PNG, WEBP.'));
    }
  }
});

const validateImageFile = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const actualType = await fileTypeFromBuffer(req.file.buffer);
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!actualType || !validMimes.includes(actualType.mime)) {
      return res.status(400).json({ error: 'Cảnh báo an ninh: Định dạng file bị làm giả! Hãy tải lên file ảnh thật.' });
    }

    const uploadDir = path.join(__dirname, '../../storage/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const safeFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${actualType.ext}`;
    const destinationPath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(destinationPath, req.file.buffer);

    req.file.safeUrl = `/api/files/${safeFileName}`; 
    next();
  } catch (error) {
    console.error('Lỗi khi quét file:', error);
    res.status(500).json({ error: 'Lỗi server khi xử lý file tải lên.' });
  }
};

// ==========================================
// 2. DOCUMENT / ATTACHMENT UPLOAD
// ==========================================
const uploadDocumentMw = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

const validateDocumentFile = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Vui lòng đính kèm một tệp tài liệu.' });
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const actualType = await fileTypeFromBuffer(req.file.buffer);
    
    const originalName = req.file.originalname;
    const originalExt = path.extname(originalName).toLowerCase().replace('.', '');
    
    let isSafe = false;
    let finalExt = originalExt || 'bin';
    
    // file-type returns undefined for text files (no magic number)
    if (!actualType) {
      if (originalExt === 'txt') {
        isSafe = true;
        finalExt = 'txt';
      }
    } else {
      const allowedExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', 'xz', 'tar', '7z'];
      if (allowedExts.includes(actualType.ext)) {
        isSafe = true;
        finalExt = actualType.ext;
      }
    }

    if (!isSafe) {
      return res.status(400).json({ error: 'Định dạng file không được hỗ trợ. Cho phép: PDF, Office, ZIP, RAR, 7Z, TAR, TAR.XZ, TXT.' });
    }

    const uploadDir = path.join(__dirname, '../../storage/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const safeFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${finalExt}`;
    const destinationPath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(destinationPath, req.file.buffer);
    
    req.file.safeUrl = `/api/files/${safeFileName}`;
    req.file.originalName = originalName;
    next();
  } catch (error) {
    console.error('Lỗi khi quét file document:', error);
    res.status(500).json({ error: 'Lỗi server khi xử lý tệp tải lên.' });
  }
};

module.exports = {
  uploadImage: [uploadImageMw.single('file'), validateImageFile],
  uploadDocument: [uploadDocumentMw.single('file'), validateDocumentFile]
};
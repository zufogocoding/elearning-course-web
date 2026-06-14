const { sendError } = require('../lib/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('🔥 [Global Error]:', err);

  let statusCode = 500;
  let message = 'Lỗi server nội bộ';
  let details = null;

  // Prisma Errors
  if (err.code && err.code.startsWith('P')) {
    statusCode = 400; // Default Bad Request for DB errors
    if (err.code === 'P2002') {
      statusCode = 409; // Conflict
      message = `Dữ liệu đã tồn tại (Trùng lặp trường ${err.meta?.target || 'duy nhất'}).`;
    } else if (err.code === 'P2025') {
      statusCode = 404; // Not Found
      message = 'Không tìm thấy bản ghi dữ liệu.';
    } else {
      message = 'Lỗi truy vấn cơ sở dữ liệu.';
    }
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ hoặc bị lỗi.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn. Vui lòng đăng nhập lại.';
  }

  // Zod Errors (If not caught by middleware)
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Dữ liệu đầu vào không hợp lệ.';
    details = err.errors; // Array of validation errors
  }

  // Custom Errors
  if (err.status) {
    statusCode = err.status;
  }
  if (err.message && statusCode !== 500) {
    message = err.message;
  }

  // Debug info in non-production
  if (process.env.NODE_ENV !== 'production') {
    details = details || err.stack;
  }

  return sendError(res, message, statusCode, details);
};

module.exports = errorHandler;

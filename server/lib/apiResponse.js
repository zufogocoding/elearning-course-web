const sendSuccess = (res, data, message = 'Thành công', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const sendError = (res, error = 'Đã có lỗi xảy ra', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error,
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};

const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');
const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../lib/apiResponse');

// [POST] Tạo khóa học mới (Yêu cầu quyền Admin)
const createCourse = asyncHandler(async (req, res) => {
  const {
    title, slug, shortDescription, fullDescription, level, price,
    discountPrice, thumbnailUrl, previewVideoUrl, status, categoryId,
  } = req.body;
  const adminId = req.user.id;

  if (!title || !slug) {
    const error = new Error('Thiếu thông tin bắt buộc: title, slug');
    error.status = 400;
    throw error;
  }

  const newCourse = await prisma.course.create({
    data: {
      title, slug, shortDescription, fullDescription,
      level: level || "beginner",
      price: price ? parseFloat(price) : 0,
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      thumbnailUrl, previewVideoUrl,
      status: status || "draft",
      categoryId: categoryId ? parseInt(categoryId) : null,
      createdBy: adminId,
    },
    select: {
      id: true, title: true, slug: true, status: true, createdAt: true,
      creator: { select: { id: true, username: true, email: true } }
    }
  });

  return sendSuccess(res, newCourse, 'Tạo khóa học thành công', 201);
});

// [GET] Lấy danh sách khóa học (Public)
const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { status: 'published', deletedAt: null },
    select: {
      id: true, title: true, slug: true, shortDescription: true,
      price: true, discountPrice: true, thumbnailUrl: true, level: true,
      creator: { select: { username: true } },
      category: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return sendSuccess(res, courses);
});

// [GET] Lấy danh sách khóa học cho Admin (Tất cả trạng thái + Phân trang)
const getAdminCourses = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const where = { createdBy: adminId, deletedAt: null };
  if (req.query.status) where.status = req.query.status;

  const [courses, totalCourses] = await Promise.all([
    prisma.course.findMany({
      where, skip, take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { sections: true, enrollments: true } }
      }
    }),
    prisma.course.count({ where })
  ]);

  return sendSuccess(res, courses, 'Lấy danh sách thành công', 200, {
    total: totalCourses,
    page,
    totalPages: Math.ceil(totalCourses / limit)
  });
});

// [GET] Lấy chi tiết khóa học theo Slug (Dành cho trang chi tiết Public & Admin)
const getCourseBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      creator: { select: { id: true, username: true, avatarUrl: true } },
      sections: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true, title: true, contentType: true, durationSeconds: true,
              isPreview: true, orderIndex: true,
            }
          }
        }
      }
    }
  });

  if (!course || course.deletedAt) {
    const error = new Error('Không tìm thấy khóa học.');
    error.status = 404;
    throw error;
  }

  return sendSuccess(res, course);
});

// [PUT] Cập nhật khóa học (Admin)
const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const existingCourse = await prisma.course.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingCourse || existingCourse.deletedAt) {
    const error = new Error('Không tìm thấy khóa học để cập nhật.');
    error.status = 404;
    throw error;
  }

  let newVersion = existingCourse.version;
  if (existingCourse.status === 'published') newVersion += 1;

  const dataToUpdate = {
    ...updateData,
    version: newVersion,
    ...(updateData.price !== undefined && { price: parseFloat(updateData.price) }),
    ...(updateData.discountPrice !== undefined && { discountPrice: parseFloat(updateData.discountPrice) }),
    ...(updateData.categoryId !== undefined && { categoryId: parseInt(updateData.categoryId) }),
  };

  const updatedCourse = await prisma.course.update({
    where: { id: parseInt(id) },
    data: dataToUpdate
  });

  return sendSuccess(res, updatedCourse, 'Cập nhật khóa học thành công');
});

// [DELETE] Xóa mềm khóa học (Admin)
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingCourse = await prisma.course.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingCourse || existingCourse.deletedAt) {
    const error = new Error('Khóa học không tồn tại hoặc đã bị xóa.');
    error.status = 404;
    throw error;
  }

  const deletedCourse = await prisma.course.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date(), status: 'archived' }
  });

  return sendSuccess(res, { courseId: deletedCourse.id }, 'Khóa học đã được đưa vào thùng rác (Soft Delete).');
});

// [POST] Upload hình ảnh dưới dạng Base64 (Admin)
const uploadImage = asyncHandler(async (req, res) => {
  const { image } = req.body;
  if (!image) {
    const error = new Error('Không tìm thấy hình ảnh.');
    error.status = 400;
    throw error;
  }

  const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    const error = new Error('Định dạng hình ảnh Base64 không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const type = matches[1];
  const extension = type.split('/')[1] || 'png';
  const buffer = Buffer.from(matches[2], 'base64');

  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `cover_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
  return sendSuccess(res, { url: fileUrl }, 'Upload thành công');
});

// [GET] Lấy thống kê chung (Public)
const getPublicStats = asyncHandler(async (req, res) => {
  const [coursesCount, usersCount, enrollmentsCount] = await Promise.all([
    prisma.course.count({ where: { status: 'published', deletedAt: null } }),
    prisma.user.count(),
    prisma.enrollment.count()
  ]);

  const stats = [
    { label: 'Học viên tin tưởng', value: `${(usersCount + 5000).toLocaleString()}+` },
    { label: 'Khóa học chất lượng', value: `${coursesCount > 0 ? coursesCount : '150'}+` },
    { label: 'Lượt ghi danh', value: `${(enrollmentsCount + 10000).toLocaleString()}+` },
    { label: 'Đánh giá tích cực', value: '98%' }
  ];

  return sendSuccess(res, stats);
});

module.exports = {
  createCourse,
  getAllCourses,
  getAdminCourses,
  getCourseBySlug, 
  updateCourse,    
  deleteCourse,
  uploadImage,
  getPublicStats
};
const prisma = require('../lib/prisma');
const fs = require('fs');
const path = require('path');
const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../lib/apiResponse');

// [POST] Tạo khóa học mới (Admin)
const createCourse = async (req, res) => {
  try {
    const {
      title, slug, shortDescription, fullDescription, level,
      price, discountPrice, thumbnailUrl, previewVideoUrl, status, categoryId
    } = req.body;

    const adminId = req.user.id;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: title, slug' });
    }

    // ==========================================
    // SERVER-SIDE VALIDATION: KIỂM TRA GIÁ TIỀN
    // ==========================================
    let finalPrice = 0;
    let finalDiscountPrice = null;

    // 1. Validate Price (Giá gốc)
    if (price !== undefined && price !== null) {
      finalPrice = parseFloat(price);
      // Chặn giá trị không phải số (NaN) hoặc số âm
      if (isNaN(finalPrice) || finalPrice < 0) {
        return res.status(400).json({ error: 'Bảo mật: Giá khóa học (price) phải là một số lớn hơn hoặc bằng 0.' });
      }
    }

    // 2. Validate Discount Price (Giá giảm)
    if (discountPrice !== undefined && discountPrice !== null) {
      finalDiscountPrice = parseFloat(discountPrice);
      if (isNaN(finalDiscountPrice) || finalDiscountPrice < 0) {
        return res.status(400).json({ error: 'Bảo mật: Giá giảm (discountPrice) không hợp lệ.' });
      }
      // 3. Logic nghiệp vụ: Giá giảm tuyệt đối không được lớn hơn hoặc bằng giá gốc
      if (finalDiscountPrice >= finalPrice) {
        return res.status(400).json({ error: 'Bảo mật: Giá giảm khuyến mãi phải nhỏ hơn giá gốc của khóa học.' });
      }
    }

    const newCourse = await prisma.course.create({
      data: {
        title, slug, shortDescription, fullDescription,
        level: level || "beginner",
        price: finalPrice, 
        discountPrice: finalDiscountPrice,
        thumbnailUrl, previewVideoUrl,
        status: status || "draft",
        categoryId: categoryId ? parseInt(categoryId) : null,
        createdBy: adminId,
      },
      select: { id: true, title: true, price: true, discountPrice: true }
    });

    res.status(201).json({ message: 'Tạo khóa học thành công', course: newCourse });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Slug khóa học đã tồn tại.' });
    res.status(500).json({ error: 'Lỗi server khi tạo khóa học.' });
  }
};


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
const updateCourse = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const existingCourse = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCourse || existingCourse.deletedAt) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học.' });
    }

    // ==========================================
    // SERVER-SIDE VALIDATION: KIỂM TRA GIÁ TIỀN UPDATE
    // ==========================================
    let newPrice = existingCourse.price; // Mặc định lấy giá cũ
    let newDiscount = existingCourse.discountPrice;

    if (updateData.price !== undefined) {
      newPrice = parseFloat(updateData.price);
      if (isNaN(newPrice) || newPrice < 0) {
        return res.status(400).json({ error: 'Bảo mật: Giá khóa học không hợp lệ.' });
      }
    }

    if (updateData.discountPrice !== undefined) {
      // Nếu gửi null hoặc chuỗi rỗng lên tức là muốn xóa giá giảm
      if (updateData.discountPrice === null || updateData.discountPrice === '') {
        newDiscount = null;
      } else {
        newDiscount = parseFloat(updateData.discountPrice);
        if (isNaN(newDiscount) || newDiscount < 0) {
          return res.status(400).json({ error: 'Bảo mật: Giá giảm không hợp lệ.' });
        }
      }
    }

    // Kiểm tra logic chéo: Giá giảm mới có bị lớn hơn giá gốc (mới hoặc cũ) không?
    if (newDiscount !== null && newDiscount >= newPrice) {
      return res.status(400).json({ error: 'Bảo mật: Giá giảm không được lớn hơn hoặc bằng giá gốc.' });
    }
    // ==========================================

    let newVersion = existingCourse.version;
    if (existingCourse.status === 'published') newVersion += 1;

    // [BUG-12 FIX] Whitelist các trường được phép cập nhật, chống mass assignment
    const allowedFields = [
      'title', 'slug', 'shortDescription', 'fullDescription', 'level',
      'thumbnailUrl', 'previewVideoUrl', 'status', 'publishedAt'
    ];
    const safeData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        safeData[field] = updateData[field];
      }
    }

    const dataToUpdate = {
      ...safeData,
      version: newVersion,
      price: newPrice,
      discountPrice: newDiscount,
      ...(updateData.categoryId !== undefined && { categoryId: parseInt(updateData.categoryId) }),
    };

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    });

    res.status(200).json({ message: 'Cập nhật thành công', course: updatedCourse });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Slug đã tồn tại.' });
    res.status(500).json({ error: 'Lỗi server khi cập nhật khóa học.' });
  }
};

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

  // [BUG-13 FIX] Thống nhất lưu vào storage/uploads/ giống uploadMiddleware
  const uploadsDir = path.join(__dirname, '../../storage/uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `cover_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);

  // [BUG-13 FIX] Trả URL qua /api/files/ thay vì /uploads/
  const fileUrl = `/api/files/${filename}`;
  return sendSuccess(res, { url: fileUrl }, 'Upload thành công');
});

// [GET] Lấy thống kê chung (Public)
const getPublicStats = asyncHandler(async (req, res) => {
  const [coursesCount, usersCount, enrollmentsCount] = await Promise.all([
    prisma.course.count({ where: { status: 'published', deletedAt: null } }),
    prisma.user.count(),
    prisma.enrollment.count()
  ]);

  // [BUG-07 FIX] Hiển thị dữ liệu thật thay vì cộng thêm số giả
  const avgRatingResult = await prisma.courseReview.aggregate({
    _avg: { rating: true },
    _count: true
  });
  const avgRating = avgRatingResult._avg.rating 
    ? Math.round(avgRatingResult._avg.rating * 10) / 10 
    : 0;
  const positivePercent = avgRatingResult._count > 0
    ? Math.round((await prisma.courseReview.count({ where: { rating: { gte: 4 } } })) / avgRatingResult._count * 100)
    : 0;

  const stats = [
    { label: 'Học viên tin tưởng', value: `${usersCount.toLocaleString()}+` },
    { label: 'Khóa học chất lượng', value: `${coursesCount}+` },
    { label: 'Lượt ghi danh', value: `${enrollmentsCount.toLocaleString()}+` },
    { label: 'Đánh giá tích cực', value: positivePercent > 0 ? `${positivePercent}%` : 'N/A' }
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
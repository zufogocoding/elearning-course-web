const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../lib/apiResponse');

// [POST] Tạo danh mục mới (Admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, parentId } = req.body;

  if (!name || !slug) {
    const error = new Error('Tên danh mục và slug là bắt buộc.');
    error.status = 400;
    throw error;
  }

  const newCategory = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      parentId: parentId ? parseInt(parentId) : null,
    }
  });

  return sendSuccess(res, newCategory, 'Tạo danh mục thành công', 201);
});

// [GET] Lấy danh sách danh mục (Cấu trúc cây: Cha -> Con) - Public
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { 
      parentId: null,
      deletedAt: null 
    },
    include: {
      children: {
        where: { deletedAt: null },
        select: { id: true, name: true, slug: true }
      }
    }
  });

  return sendSuccess(res, categories);
});

// [PUT] Cập nhật danh mục (Admin)
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, parentId } = req.body;

  const updatedCategory = await prisma.category.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(description !== undefined && { description }),
      ...(parentId !== undefined && { parentId: parentId ? parseInt(parentId) : null })
    }
  });

  return sendSuccess(res, updatedCategory, 'Cập nhật thành công');
});

// [DELETE] Xóa mềm danh mục (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.category.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() }
  });

  return sendSuccess(res, null, 'Danh mục đã được xóa mềm.');
});

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
};
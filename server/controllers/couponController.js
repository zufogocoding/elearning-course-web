const prisma = require('../lib/prisma');

// [GET] /api/admin/coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { id: 'desc' }
    });
    res.json({ coupons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// [POST] /api/admin/coupons
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, validFrom, validTo, usageLimit, isActive } = req.body;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    // KIỂM TRA ĐỊNH DẠNG VÀ LOGIC NGÀY THÁNG
    if (validFrom) {
      const parsedFrom = new Date(validFrom);
      if (isNaN(parsedFrom.getTime())) return res.status(400).json({ error: 'Định dạng validFrom không hợp lệ.' });
    }
    
    if (validTo) {
      const parsedTo = new Date(validTo);
      if (isNaN(parsedTo.getTime())) return res.status(400).json({ error: 'Định dạng validTo không hợp lệ.' });
    }

    if (validFrom && validTo) {
      const fromTime = new Date(validFrom).getTime();
      const toTime = new Date(validTo).getTime();
      if (fromTime >= toTime) {
        return res.status(400).json({ error: 'Ngày hết hạn (validTo) bắt buộc phải sau ngày bắt đầu (validFrom).' });
      }
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue: parseFloat(discountValue),
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        usageLimit: parseInt(usageLimit, 10),
        isActive: Boolean(isActive),
      }
    });

    res.status(201).json({ coupon: newCoupon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// [PUT] /api/admin/coupons/:id
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, validFrom, validTo, usageLimit, isActive } = req.body;

    // Check if the new code conflicts with another coupon
    if (code) {
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code }
      });
      if (existingCoupon && existingCoupon.id !== parseInt(id)) {
        return res.status(400).json({ error: 'Coupon code already exists' });
      }
    }

    // KIỂM TRA LOGIC NGÀY KHI UPDATE
    // ==========================================
    if (validFrom !== undefined && validFrom !== null) {
      const parsedFrom = new Date(validFrom);
      if (isNaN(parsedFrom.getTime())) return res.status(400).json({ error: 'Định dạng validFrom không hợp lệ.' });
    }

    if (validTo !== undefined && validTo !== null) {
      const parsedTo = new Date(validTo);
      if (isNaN(parsedTo.getTime())) return res.status(400).json({ error: 'Định dạng validTo không hợp lệ.' });
    }

    // Check nhanh nếu client gửi cả 2 trường lên để update cùng lúc
    if (validFrom && validTo) {
      if (new Date(validFrom).getTime() >= new Date(validTo).getTime()) {
        return res.status(400).json({ error: 'Ngày hết hạn (validTo) bắt buộc phải sau ngày bắt đầu (validFrom).' });
      }
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: {
        code,
        discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : undefined,
        validFrom: validFrom ? new Date(validFrom) : (validFrom === null ? null : undefined),
        validTo: validTo ? new Date(validTo) : (validTo === null ? null : undefined),
        usageLimit: usageLimit !== undefined ? parseInt(usageLimit, 10) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      }
    });

    res.json({ coupon: updatedCoupon });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// [DELETE] /api/admin/coupons/:id
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.coupon.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

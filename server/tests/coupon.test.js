const { validateCoupon } = require('../controllers/enrollmentController'); 
const prisma = require('../lib/prisma');

// Mock bảng coupon
jest.mock('../lib/prisma', () => ({
  coupon: { findUnique: jest.fn() },
  enrollment: { findMany: jest.fn() },
  couponCourse: { findMany: jest.fn() }
}));

describe('Kiểm thử Bảo mật Logic Coupon (Time Bypass & Usage Limit)', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { code: 'TEST_CODE' }, query: { courseId: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 🔴 TEST CASE 1: MÃ CHƯA TỚI NGÀY BẮT ĐẦU (Đồng bộ với logic chặn của hàm validateCoupon thực tế)
  it('Phải chặn nếu mã giảm giá chưa đến ngày có hiệu lực', async () => {
    // Giả lập hệ thống đang ở ngày 10/06
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T12:00:00Z'));

    prisma.coupon.findUnique.mockResolvedValue({
      code: 'TEST_CODE',
      isActive: true,
      validFrom: new Date('2026-06-15T00:00:00Z'), // 15/06 mới bắt đầu
      validTo: new Date('2026-06-30T00:00:00Z')
    });

    await validateCoupon(req, res);

    // Sửa khớp với thông báo lỗi thực tế bạn đã bổ sung ở Controller
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Mã giảm giá chưa đến thời gian áp dụng.' });
  });

  // 🔴 TEST CASE 2: MÃ ĐÃ HẾT HẠN (Đã sửa lại câu chữ cho khớp 100% với Controller)
  it('Phải chặn nếu mã giảm giá đã quá hạn', async () => {
    // Giả lập hệ thống đang ở ngày 05/07
    jest.useFakeTimers().setSystemTime(new Date('2026-07-05T08:00:00Z'));

    prisma.coupon.findUnique.mockResolvedValue({
      code: 'TEST_CODE',
      isActive: true,
      validFrom: new Date('2026-06-01T00:00:00Z'),
      validTo: new Date('2026-06-30T23:59:59Z') // 30/06 hết hạn
    });

    await validateCoupon(req, res);

    // Sửa lại chuỗi text báo lỗi chính xác theo code Controller của bạn
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Mã giảm giá đã hết hạn.' });
  });

  // 🔴 TEST CASE 3: MÃ HẾT LƯỢT SỬ DỤNG
  it('Phải chặn nếu mã giảm giá đã vượt quá usageLimit', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-20T12:00:00Z'));

    prisma.coupon.findUnique.mockResolvedValue({
      code: 'TEST_CODE',
      isActive: true,
      validFrom: new Date('2026-06-01T00:00:00Z'),
      validTo: new Date('2026-06-30T23:59:59Z'),
      usageLimit: 50, 
      usedCount: 50 
    });

    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Mã giảm giá đã hết lượt sử dụng.' });
  });

  // 🟢 TEST CASE 4: THÀNH CÔNG HỢP LỆ
  it('Phải cho phép áp dụng nếu hợp lệ', async () => {
    req.user = { id: 1 };
    jest.useFakeTimers().setSystemTime(new Date('2026-06-20T12:00:00Z'));

    prisma.coupon.findUnique.mockResolvedValue({
      id: 1,
      code: 'TEST_CODE',
      isActive: true,
      validFrom: new Date('2026-06-01T00:00:00Z'),
      validTo: new Date('2026-06-30T23:59:59Z'),
      usageLimit: 50,
      usedCount: 10, 
      discountType: 'percent',
      discountValue: 20
    });
    
    prisma.enrollment.findMany.mockResolvedValue([]);
    prisma.couponCourse.findMany.mockResolvedValue([]);

    await validateCoupon(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });
});
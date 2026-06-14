const prisma = require('../lib/prisma');
const crypto = require('crypto');
const querystring = require('qs');
const axios = require('axios');

// ============================================
// HÀM HỖ TRỢ CHO PAYOS (VIETQR)
// ============================================
const createPayOSSignature = (data, checksumKey) => {
  const { amount, cancelUrl, description, orderCode, returnUrl } = data;
  const queryString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return crypto.createHmac('sha256', checksumKey).update(queryString).digest('hex');
};

// ============================================
// HÀM HỖ TRỢ CHO VNPAY
// ============================================
const formatVNPayDate = (date) => {
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const sortObject = (obj) => {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
};

// ============================================
// API 1: BẮT ĐẦU THANH TOÁN (Tạo URL VNPay)
// ============================================
const createPayment = async (req, res) => {
  const userId = req.user.id;
  const { courseId, couponCode, paymentMethod = 'vnpay' } = req.body;
  const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    // 1. Kiểm tra khóa học
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course || course.deletedAt) {
      return res.status(404).json({ error: 'Khóa học không tồn tại hoặc đã bị xóa' });
    }

    // 2. Kiểm tra user đã mua khóa này chưa (tránh mua trùng)
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: parseInt(courseId) } }
    });
    if (existing && existing.status === 'active') {
      return res.status(409).json({ error: 'Bạn đã sở hữu khóa học này rồi' });
    }

    // 3. Tính toán giá tiền và Mã giảm giá
    let finalAmount = Number(course.price);
    let appliedCoupon = null;

    if (couponCode) {
      appliedCoupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      const now = new Date();
      
      // Validate Coupon
      if (!appliedCoupon || !appliedCoupon.isActive || (appliedCoupon.validTo && appliedCoupon.validTo < now)) {
        return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
      }

      // Kiểm tra xem coupon có áp dụng cho khóa học này không
      const couponCourses = await prisma.couponCourse.findMany({
        where: { couponId: appliedCoupon.id }
      });
      if (couponCourses.length > 0) {
        const isApplicable = couponCourses.some(cc => cc.courseId === parseInt(courseId));
        if (!isApplicable) {
          return res.status(400).json({ error: 'Mã giảm giá này không áp dụng cho khóa học hiện tại.' });
        }
      }

      // Trừ tiền
      if (appliedCoupon.discountType.toLowerCase() === 'percent') {
        finalAmount -= (finalAmount * Number(appliedCoupon.discountValue)) / 100;
      } else {
        finalAmount -= Number(appliedCoupon.discountValue);
      }
      finalAmount = Math.max(0, finalAmount);
    }

    // 4. Lưu Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      const isFree = finalAmount === 0;
      
      // Tạo hoặc cập nhật Enrollment
      const enrollment = await tx.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: parseInt(courseId) } },
        update: { 
          status: isFree ? 'active' : 'pending', 
          couponId: appliedCoupon?.id 
        },
        create: {
          userId,
          courseId: parseInt(courseId),
          couponId: appliedCoupon?.id,
          status: isFree ? 'active' : 'pending'
        }
      });

      // Tạo hoặc cập nhật Lịch sử Giao dịch
      const payment = await tx.paymentTransaction.upsert({
        where: { enrollmentId: enrollment.id },
        update: {
          amount: finalAmount,
          paymentMethod: isFree ? 'free' : paymentMethod,
          status: isFree ? 'completed' : 'pending'
        },
        create: {
          enrollmentId: enrollment.id,
          userId,
          amount: finalAmount,
          paymentMethod: isFree ? 'free' : paymentMethod,
          status: isFree ? 'completed' : 'pending'
        }
      });

      return { enrollment, payment, isFree };
    });

    // Nếu khóa học miễn phí (hoặc giảm còn 0đ), trả về thành công luôn
    if (result.isFree) {
      return res.status(200).json({ message: 'Đăng ký khóa học thành công', isFree: true });
    }

    // 5. Cổng thanh toán tương ứng
    if (paymentMethod === 'vietqr') {
      const clientId = process.env.PAYOS_CLIENT_ID;
      const apiKey = process.env.PAYOS_API_KEY;
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

      if (!clientId || !apiKey || !checksumKey) {
        console.error('PayOS configuration missing in environment');
        return res.status(500).json({ error: 'Chưa cấu hình thông tin thanh toán PayOS' });
      }

      const finalAmountInt = Math.round(finalAmount);
      const returnUrl = `${process.env.CLIENT_URL}/payment-result?vnp_ResponseCode=00&vnp_TxnRef=${result.payment.id}&vnp_Amount=${finalAmountInt * 100}&vnp_OrderInfo=courseId:${courseId}`;
      const cancelUrl = `${process.env.CLIENT_URL}/payment-result?vnp_ResponseCode=24&vnp_TxnRef=${result.payment.id}&vnp_OrderInfo=courseId:${courseId}`;
      const desc = `CQ${result.payment.id}`;

      const payosData = {
        orderCode: result.payment.id,
        amount: finalAmountInt,
        description: desc,
        cancelUrl: cancelUrl,
        returnUrl: returnUrl
      };

      const payosSignature = createPayOSSignature(payosData, checksumKey);
      payosData.signature = payosSignature;

      try {
        const payosResponse = await axios.post(
          'https://api-merchant.payos.vn/v2/payment-requests',
          payosData,
          {
            headers: {
              'x-client-id': clientId,
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
            }
          }
        );

        if (payosResponse.data && payosResponse.data.code === '00') {
          return res.status(200).json({
            message: 'Vui lòng hoàn tất thanh toán',
            paymentUrl: payosResponse.data.data.checkoutUrl
          });
        } else {
          console.error('PayOS API error:', payosResponse.data);
          
          // Fallback/Mock trong môi trường dev nếu khóa chưa được điền
          if (process.env.NODE_ENV === 'development' && (clientId.startsWith('your_') || apiKey.startsWith('your_'))) {
            console.log('--- RUNNING IN PAYOS MOCK MODE (DEV ONLY) ---');
            return res.status(200).json({
              message: 'Vui lòng hoàn tất thanh toán (MOCK)',
              paymentUrl: returnUrl
            });
          }
          return res.status(500).json({ error: payosResponse.data.desc || 'Lỗi khi gọi API PayOS' });
        }
      } catch (payosErr) {
        console.error('PayOS API request failed:', payosErr.response?.data || payosErr.message);
        
        // Fallback/Mock trong môi trường dev nếu khóa chưa được điền
        if (process.env.NODE_ENV === 'development' && (clientId.startsWith('your_') || apiKey.startsWith('your_'))) {
          console.log('--- RUNNING IN PAYOS MOCK MODE (DEV ONLY) ---');
          return res.status(200).json({
            message: 'Vui lòng hoàn tất thanh toán (MOCK)',
            paymentUrl: returnUrl
          });
        }
        return res.status(500).json({ error: 'Không thể kết nối tới cổng thanh toán PayOS' });
      }
    } else {
      // VNPAY
      const tmnCode = process.env.VNP_TMN_CODE;
      const secretKey = process.env.VNP_HASH_SECRET;
      const vnpUrl = process.env.VNP_URL;
      const returnUrl = process.env.VNP_RETURN_URL;
      
      const date = new Date();
      const createDate = formatVNPayDate(date);
      date.setMinutes(date.getMinutes() + 15); // URL hết hạn sau 15 phút
      const expireDate = formatVNPayDate(date);

      let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': result.payment.id.toString(),
        'vnp_OrderInfo': `Thanh toan khoa hoc ${courseId}`,
        'vnp_OrderType': 'other',
        'vnp_Amount': finalAmount * 100,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate,
        'vnp_ExpireDate': expireDate
      };

      vnp_Params = sortObject(vnp_Params);
      const signData = querystring.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
      vnp_Params['vnp_SecureHash'] = signed;

      const paymentUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });

      return res.status(200).json({ 
        message: 'Vui lòng hoàn tất thanh toán',
        paymentUrl: paymentUrl
      });
    }

  } catch (error) {
    console.error('Lỗi khi khởi tạo thanh toán:', error);
    return res.status(500).json({ error: 'Lỗi server trong quá trình xử lý' });
  }
};

// ============================================
// API 2: XỬ LÝ KẾT QUẢ TỪ VNPAY (IPN Webhook)
// ============================================
const vnpayIpn = async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params['vnp_SecureHash'];

  // Xóa mã băm cũ để chuẩn bị tạo mã băm mới đối chiếu
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  const secretKey = process.env.VNP_HASH_SECRET;
  
  if (!secretKey) {
    console.error('VNP_HASH_SECRET is not defined in .env');
    return res.status(500).json({ RspCode: '99', Message: 'Server configuration error' });
  }

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");     

  // 1. Kiểm tra chữ ký bảo mật (Chống giả mạo request)
  if (secureHash === signed) {
    const paymentId = parseInt(vnp_Params['vnp_TxnRef']);
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const gatewayTransactionId = vnp_Params['vnp_TransactionNo'];

    try {
      // 2. Tìm đơn hàng trong DB
      const payment = await prisma.paymentTransaction.findUnique({
        where: { id: paymentId },
        include: { enrollment: true }
      });

      if (!payment) {
        return res.status(200).json({ RspCode: '01', Message: 'Không tìm thấy giao dịch' });
      }

      if (payment.status === 'completed') {
        return res.status(200).json({ RspCode: '02', Message: 'Giao dịch đã được xác nhận trước đó' });
      }

      // 3. Cập nhật trạng thái
      if (responseCode === '00') {
        // Mã '00' là khách đã thanh toán thành công
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: paymentId },
            data: { status: 'completed', gatewayTransactionId }
          }),
          prisma.enrollment.update({
            where: { id: payment.enrollmentId },
            data: { status: 'active' }
          }),
          // Tăng lượt dùng mã giảm giá (nếu có)
          ...(payment.enrollment.couponId ? [
            prisma.coupon.update({
              where: { id: payment.enrollment.couponId },
              data: { usedCount: { increment: 1 } }
            })
          ] : [])
        ]);
        
        return res.status(200).json({ RspCode: '00', Message: 'Xác nhận thành công' });
      } else {
        // Thanh toán thất bại hoặc khách bấm hủy
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: paymentId },
            data: { status: 'failed', gatewayTransactionId }
          }),
          prisma.enrollment.update({
            where: { id: payment.enrollmentId },
            data: { status: 'revoked' }
          })
        ]);

        return res.status(200).json({ RspCode: '00', Message: 'Giao dịch thất bại' });
      }
    } catch (error) {
      console.error('Lỗi xử lý IPN:', error);
      return res.status(200).json({ RspCode: '99', Message: 'Lỗi không xác định' });
    }
  } else {
    // Nếu chữ ký không khớp, báo lỗi Checksum
    return res.status(200).json({ RspCode: '97', Message: 'Sai chữ ký bảo mật' });
  }
};

// ============================================
// API 3: KIỂM TRA MÃ GIẢM GIÁ (Validate Coupon)
// ============================================
const validateCoupon = async (req, res) => {
  const { code } = req.params;
  const { courseId } = req.query;

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    const now = new Date();

    if (!coupon || !coupon.isActive || (coupon.validTo && coupon.validTo < now)) {
      return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng.' });
    }

    // Kiểm tra xem coupon có áp dụng cho khóa học này không
    if (courseId) {
      const parsedCourseId = parseInt(courseId);
      const couponCourses = await prisma.couponCourse.findMany({
        where: { couponId: coupon.id }
      });
      if (couponCourses.length > 0) {
        const isApplicable = couponCourses.some(cc => cc.courseId === parsedCourseId);
        if (!isApplicable) {
          return res.status(400).json({ error: 'Mã giảm giá này không áp dụng cho khóa học hiện tại.' });
        }
      }
    }

    return res.status(200).json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra mã giảm giá:', error);
    return res.status(500).json({ error: 'Lỗi server khi kiểm tra mã giảm giá.' });
  }
};

// ============================================
// API 4: XỬ LÝ KẾT QUẢ TỪ PAYOS (Webhook)
// ============================================
const payosWebhook = async (req, res) => {
  const payload = req.body;
  const signature = payload.signature;
  const data = payload.data;

  if (!signature || !data) {
    return res.status(400).json({ error: 'Thiếu signature hoặc data' });
  }

  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!checksumKey) {
    console.error('PAYOS_CHECKSUM_KEY is not defined in env');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // 1. Xác thực chữ ký
  const sortedKeys = Object.keys(data).sort();
  const queryString = sortedKeys
    .map(key => {
      let val = data[key];
      if (val === null || val === undefined) {
        val = "";
      }
      return `${key}=${val}`;
    })
    .join("&");

  const hmac = crypto.createHmac("sha256", checksumKey);
  hmac.update(queryString);
  const calculatedSignature = hmac.digest("hex");

  if (calculatedSignature !== signature) {
    return res.status(400).json({ error: 'Sai chữ ký bảo mật' });
  }

  // 2. Chữ ký hợp lệ, xử lý đơn hàng
  const orderCode = data.orderCode; // Đây là ID của PaymentTransaction
  const paymentId = parseInt(orderCode);

  try {
    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: { enrollment: true }
    });

    if (!payment) {
      return res.status(200).json({ message: 'Không tìm thấy giao dịch' });
    }

    if (payment.status === 'completed') {
      return res.status(200).json({ message: 'Giao dịch đã được xác nhận trước đó' });
    }

    if (payload.code === '00') {
      // Thanh toán thành công
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: paymentId },
          data: { status: 'completed', gatewayTransactionId: data.paymentLinkId }
        }),
        prisma.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: 'active' }
        }),
        ...(payment.enrollment.couponId ? [
          prisma.coupon.update({
            where: { id: payment.enrollment.couponId },
            data: { usedCount: { increment: 1 } }
          })
        ] : [])
      ]);
      return res.status(200).json({ message: 'Xác nhận thành công' });
    } else {
      // Giao dịch thất bại
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: paymentId },
          data: { status: 'failed', gatewayTransactionId: data.paymentLinkId }
        }),
        prisma.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: 'revoked' }
        })
      ]);
      return res.status(200).json({ message: 'Giao dịch thất bại đã ghi nhận' });
    }
  } catch (error) {
    console.error('Lỗi xử lý PayOS Webhook:', error);
    return res.status(500).json({ error: 'Lỗi không xác định' });
  }
};

module.exports = {
  createPayment,
  vnpayIpn,
  validateCoupon,
  payosWebhook
};
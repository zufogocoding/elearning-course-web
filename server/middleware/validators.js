const { z } = require('zod');

/**
 * Express middleware helper to validate request body using Zod schema
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Zod v4: dùng error.issues thay vì error.errors
      const issues = error.issues || error.errors || [];
      const errorMessage = issues.map((err) => err.message).join('. ');
      return res.status(400).json({ error: errorMessage });
    }
    next(error);
  }
};

// 1. Schema Đăng ký
const registerSchema = z.object({
  email: z.string({ required_error: "Email là bắt buộc" })
    .email("Định dạng email không hợp lệ"),
  username: z.string({ required_error: "Username là bắt buộc" })
    .min(3, "Username phải có ít nhất 3 ký tự")
    .max(30, "Username không được vượt quá 30 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ được chứa chữ cái, chữ số và dấu gạch dưới"),
  password: z.string({ required_error: "Mật khẩu là bắt buộc" })
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

// 2. Schema Đăng nhập
const loginSchema = z.object({
  email: z.string({ required_error: "Email là bắt buộc" })
    .email("Định dạng email không hợp lệ"),
  password: z.string({ required_error: "Mật khẩu là bắt buộc" })
    .min(1, "Mật khẩu không được để trống"),
});

// 3. Schema Đặt lại mật khẩu (OTP-based reset flow)
const resetPasswordSchema = z.object({
  resetToken: z.string({ required_error: "Thiếu token khôi phục mật khẩu" }),
  newPassword: z.string({ required_error: "Mật khẩu mới là bắt buộc" })
    .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
});

// 4. Schema Cập nhật Profile cá nhân
const updateMeSchema = z.object({
  username: z.string()
    .min(3, "Tên hiển thị phải có ít nhất 3 ký tự")
    .max(50, "Tên hiển thị không được vượt quá 50 ký tự")
    .optional(),
  bio: z.string().max(500, "Bio không được vượt quá 500 ký tự").optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự").optional(),
}).superRefine((data, ctx) => {
  if (data.newPassword && !data.currentPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu",
      path: ["currentPassword"],
    });
  }
});

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateResetPassword: validate(resetPasswordSchema),
  validateUpdateMe: validate(updateMeSchema),
};

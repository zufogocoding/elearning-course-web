import { z } from "zod";

// 1. Schema Đăng ký
export const registerSchema = z.object({
  username: z.string()
    .min(3, "Tên hiển thị phải có ít nhất 3 ký tự")
    .max(50, "Tên hiển thị không được vượt quá 50 ký tự"),
  email: z.string()
    .min(1, "Email là bắt buộc")
    .email("Email không đúng định dạng"),
  password: z.string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string()
    .min(1, "Vui lòng xác nhận lại mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

// 2. Schema Đăng nhập
export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email là bắt buộc")
    .email("Email không đúng định dạng"),
  password: z.string()
    .min(1, "Mật khẩu không được để trống"),
});

// 3. Schema Quên mật khẩu & Reset (Step 3)
export const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  confirmPassword: z.string()
    .min(1, "Vui lòng xác nhận lại mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

// 4. Schema Cập nhật Hồ sơ cá nhân (Profile Settings)
export const updateMeSchema = z.object({
  username: z.string()
    .min(3, "Tên hiển thị phải có ít nhất 3 ký tự")
    .max(50, "Tên hiển thị không được vượt quá 50 ký tự"),
  bio: z.string().max(200, "Bio không được vượt quá 200 ký tự").optional(),
  avatarUrl: z.string().optional(),
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

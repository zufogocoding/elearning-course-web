# Lộ Trình Triển Khai Elevate LMS (Local-First & GitFlow CI/CD)

## 1. Problem Statement
Chúng ta cần đưa Elevate LMS từ môi trường chạy container local (Podman Compose) lên môi trường Cloud thực tế (Vercel + Railway + Supabase) một cách an toàn, có quy trình kiểm soát chất lượng tự động và tách biệt giữa môi trường kiểm thử (Staging) và vận hành thực tế (Production).

## 2. Recommended Direction
Xây dựng quy trình triển khai chia làm 2 nhánh chính theo chuẩn GitFlow:
* **Nhánh `develop` (Staging):** Tự động kích hoạt khi có Pull Request hoặc Merge. Deploy frontend lên Vercel Staging, backend lên Railway Staging, kết nối tới Database Supabase Staging (Sử dụng sandbox VNPay/MoMo).
* **Nhánh `main` (Production):** Chỉ trigger khi release tag hoặc merge từ `develop`. Deploy lên môi trường Vercel/Railway Production và Supabase Production.

## 3. Key Assumptions & Validation Strategies
* **A1: Cookie Cross-Domain hoạt động ổn định.**
  * *Cách test:* Deploy bản test API thô lên Railway và client lên Vercel, kiểm tra xem trình duyệt có chặn Cookie HTTP-Only ở tab Network không.
* **A2: Supabase Pooler giải quyết được bài toán cạn kiệt connection.**
  * *Cách test:* Sử dụng URL kết nối cổng `6543` (transaction mode pooler) của Supabase trong cấu hình Prisma thay vì cổng `5432` trực tiếp.

## 4. MVP Scope (Phạm vi triển khai ban đầu)
### IN SCOPE (Có thực hiện):
* Thiết lập GitHub Actions tự động kiểm tra cú pháp (`npm run lint`), TypeScript (`tsc --noEmit`), và chạy bộ test của Express.
* Tự động hóa quá trình deploy Backend lên Railway từ Dockerfile.
* Tự động hóa quá trình deploy Frontend lên Vercel.
* Cấu hình SSL/HTTPS cho cả Client và Server.
* Tích hợp thanh toán VNPay/MoMo môi trường Sandbox.

### OUT OF SCOPE (Chưa thực hiện ở giai đoạn này):
* Triển khai Zero-Downtime Migration nâng cao (Blue-Green database deploy). Nếu có migration lớn, chấp nhận bảo trì hệ thống trong 5-10 phút.
* Triển khai CDN riêng cho Media bài học (giữ nguyên Mux/Cloudflare Stream trực tiếp).

## 5. Open Questions
* Bạn đã đăng ký tài khoản Vercel, Railway và Supabase (hoặc Neon) chưa? Chúng ta nên dùng chung một tài khoản tổ chức hay tài khoản cá nhân của bạn để cấu hình?

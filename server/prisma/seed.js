require('dotenv').config();
const prisma = require('../lib/prisma.js');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Seeding database with realistic Elearning Data...');

  // Clean existing data in reverse relation order
  console.log('Cleaning existing data...');
  await prisma.couponCourse.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.userAnswer.deleteMany({});
  await prisma.userQuizAttempt.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.lessonCompletion.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.courseReview.deleteMany({});
  await prisma.courseVersion.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.emailVerificationOtp.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleaned existing data.');

  // Create an admin user
  const adminPassword = await bcrypt.hash('password123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@email.com',
      username: 'David Kim',
      passwordHash: adminPassword,
      role: 'admin',
      bio: 'Quản trị viên hệ thống Elevate',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create normal users
  const userPassword = await bcrypt.hash('password123', 12);
  const usersToCreate = [
    { email: 'alice@email.com', username: 'Alice Wang', passwordHash: userPassword, role: 'user', isActive: true, emailVerifiedAt: new Date() },
    { email: 'bob@email.com', username: 'Bob Nguyen', passwordHash: userPassword, role: 'user', isActive: true, emailVerifiedAt: new Date() },
  ];

  const createdUsers = [];
  for (const u of usersToCreate) {
    createdUsers.push(await prisma.user.create({ data: u }));
  }

  // Create Categories
  console.log('Creating categories...');
  const catWeb = await prisma.category.create({ data: { name: 'Web Development', slug: 'web-development', description: 'Học lập trình web từ cơ bản đến nâng cao' } });
  const catMobile = await prisma.category.create({ data: { name: 'Mobile Development', slug: 'mobile-development', description: 'Phát triển ứng dụng di động iOS và Android' } });
  const catData = await prisma.category.create({ data: { name: 'Data Science & AI', slug: 'data-science', description: 'Phân tích dữ liệu và Trí tuệ nhân tạo' } });
  const catDesign = await prisma.category.create({ data: { name: 'UI/UX Design', slug: 'ui-ux-design', description: 'Thiết kế giao diện và trải nghiệm người dùng' } });
  const catBusiness = await prisma.category.create({ data: { name: 'Business & Marketing', slug: 'business', description: 'Kiến thức kinh doanh và Digital Marketing' } });

  // Create Courses
  console.log('Creating courses...');
  const coursesData = [
    {
      title: 'Next.js 14 & React Mastery',
      slug: 'nextjs-react-mastery',
      shortDescription: 'Xây dựng ứng dụng Fullstack hiện đại với Next.js 14, React và TypeScript.',
      fullDescription: 'Khóa học toàn diện nhất về Next.js. Bạn sẽ học cách xây dựng ứng dụng web bảo mật, hiệu suất cao với App Router.',
      level: 'intermediate',
      price: 49.99,
      discountPrice: 29.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Python Data Science BootCamp',
      slug: 'python-data-science',
      shortDescription: 'Làm chủ Python, Pandas, NumPy, Machine Learning và Deep Learning.',
      fullDescription: 'Khóa học hoàn hảo cho người mới bắt đầu muốn trở thành Data Scientist. Từ số 0 đến làm chủ Machine Learning.',
      level: 'beginner',
      price: 59.99,
      status: 'published',
      categoryId: catData.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Flutter & Dart: The Complete Guide',
      slug: 'flutter-dart-guide',
      shortDescription: 'Lập trình ứng dụng đa nền tảng iOS và Android chỉ với một codebase bằng Flutter.',
      fullDescription: 'Khám phá sức mạnh của UI Toolkit tuyệt vời từ Google. Chúng ta sẽ cùng nhau xây dựng 5 ứng dụng thực tế.',
      level: 'intermediate',
      price: 39.99,
      discountPrice: 19.99,
      status: 'published',
      categoryId: catMobile.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1617042375876-a13e36732a04?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Mastering UI/UX Design with Figma',
      slug: 'ui-ux-design-figma',
      shortDescription: 'Thiết kế giao diện đẹp mắt và hệ thống trải nghiệm người dùng tối ưu bằng Figma.',
      fullDescription: 'Học cách thiết kế Wireframe, Prototype và Design System chuyên nghiệp nhất.',
      level: 'beginner',
      price: 29.99,
      status: 'published',
      categoryId: catDesign.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Digital Marketing Strategy 2026',
      slug: 'digital-marketing-strategy',
      shortDescription: 'Lên chiến lược Marketing đa kênh, SEO, Ads và Growth Hacking.',
      fullDescription: 'Nắm bắt các xu hướng tiếp thị mới nhất để bùng nổ doanh số bán hàng.',
      level: 'advanced',
      price: 19.99,
      status: 'published',
      categoryId: catBusiness.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'MERN Stack E-Commerce Project',
      slug: 'mern-stack-ecommerce',
      shortDescription: 'Xây dựng website bán hàng thực tế với MongoDB, Express, React và Node.js.',
      fullDescription: 'Khóa học thực chiến giúp bạn nắm vững toàn bộ quy trình làm một ứng dụng thương mại điện tử chuyên nghiệp.',
      level: 'intermediate',
      price: 54.99,
      discountPrice: 34.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Vue 3 & Composition API Masterclass',
      slug: 'vue-3-composition-api',
      shortDescription: 'Nắm vững Vue 3 và Composition API để xây dựng SPA.',
      fullDescription: 'Học cách tạo các ứng dụng tương tác cao với hệ sinh thái Vue.js hiện đại nhất.',
      level: 'beginner',
      price: 39.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1627398225081-24c89544eb1a?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Advanced Node.js & Microservices',
      slug: 'advanced-nodejs-microservices',
      shortDescription: 'Kiến trúc Microservices, Docker, Kubernetes và Node.js.',
      fullDescription: 'Dành cho các Backend Developer muốn nâng cấp lên hệ thống có khả năng mở rộng hàng triệu users.',
      level: 'advanced',
      price: 89.99,
      discountPrice: 49.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Modern CSS & Tailwind CSS Mastery',
      slug: 'modern-css-tailwind',
      shortDescription: 'Làm chủ CSS Grid, Flexbox và Tailwind CSS.',
      fullDescription: 'Thiết kế website chuẩn Responsive mà không cần tốn hàng giờ cãi nhau với CSS thuần.',
      level: 'beginner',
      price: 24.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'TypeScript for Beginners',
      slug: 'typescript-beginners',
      shortDescription: 'Bắt đầu với TypeScript - Tương lai của lập trình JavaScript.',
      fullDescription: 'Khắc phục các lỗi ngớ ngẩn của JS với hệ thống Type mạnh mẽ.',
      level: 'beginner',
      price: 19.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'GraphQL API Development with Apollo',
      slug: 'graphql-api-apollo',
      shortDescription: 'Thay thế REST API bằng GraphQL và Apollo Server.',
      fullDescription: 'Tối ưu hóa việc truy xuất dữ liệu từ server lên client bằng GraphQL query language.',
      level: 'intermediate',
      price: 44.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'SvelteKit Crash Course',
      slug: 'sveltekit-crash-course',
      shortDescription: 'Tìm hiểu framework frontend nhanh nhất hiện nay: Svelte.',
      fullDescription: 'Không Virtual DOM, code cực ngắn, hiệu năng tuyệt đối với SvelteKit.',
      level: 'intermediate',
      price: 29.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1627398225081-24c89544eb1a?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Web Security Fundamentals',
      slug: 'web-security-fundamentals',
      shortDescription: 'Bảo mật ứng dụng Web, chống lại XSS, CSRF, SQL Injection.',
      fullDescription: 'Những kiến thức bắt buộc phải có của bất kỳ Web Developer nào để bảo vệ hệ thống.',
      level: 'advanced',
      price: 59.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Angular Masterclass 2026',
      slug: 'angular-masterclass',
      shortDescription: 'Phát triển ứng dụng Web quy mô lớn với Angular.',
      fullDescription: 'Kiến trúc Modules, Dependency Injection, RxJS, Signals và mọi thứ bạn cần.',
      level: 'intermediate',
      price: 69.99,
      discountPrice: 39.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Testing Web Apps with Cypress',
      slug: 'testing-cypress',
      shortDescription: 'Đảm bảo chất lượng phần mềm với E2E Testing.',
      fullDescription: 'Tự động hóa các thao tác người dùng bằng Cypress thay vì test bằng tay nhàm chán.',
      level: 'intermediate',
      price: 34.99,
      status: 'published',
      categoryId: catWeb.id,
      createdBy: admin.id,
      publishedAt: new Date(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'
    }
  ];

  const createdCourses = [];
  for (const c of coursesData) {
    createdCourses.push(await prisma.course.create({ data: c }));
  }

  // Create a section and lesson for the first course just to have some content
  const section1 = await prisma.section.create({
    data: { courseId: createdCourses[0].id, title: 'Introduction', orderIndex: 1 }
  });

  await prisma.lesson.create({
    data: {
      sectionId: section1.id,
      title: 'Welcome to the Course',
      contentType: 'video',
      contentUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationSeconds: 300,
      isPreview: true,
      orderIndex: 1,
    }
  });

  // Create Enrollments
  await prisma.enrollment.create({
    data: {
      userId: createdUsers[0].id,
      courseId: createdCourses[0].id,
      status: 'active',
      enrolledAt: new Date(),
    }
  });

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

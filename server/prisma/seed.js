require('dotenv').config();
const prisma = require('../lib/prisma.js');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Seeding database...');

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
      bio: 'Quản trị viên hệ thống',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create normal users
  const userPassword = await bcrypt.hash('password123', 12);
  const usersToCreate = [
    {
      email: 'alice.wang@email.com',
      username: 'Alice Wang',
      passwordHash: userPassword,
      role: 'user',
      bio: 'UX designer passionate about clean interfaces.',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
    {
      email: 'brian.t@email.com',
      username: 'Brian Torres',
      passwordHash: userPassword,
      role: 'user',
      bio: 'Full-stack developer exploring new technologies.',
      isActive: true,
      emailVerifiedAt: new Date(),
    },
    {
      email: 'emma.davis@email.com',
      username: 'Emma Davis',
      passwordHash: userPassword,
      role: 'user',
      bio: 'Graphic designer and creative professional.',
      isActive: false, // Banned user
      emailVerifiedAt: new Date(),
    },
    {
      email: 'hassan.o@email.com',
      username: 'Hassan Omar',
      passwordHash: userPassword,
      role: 'user',
      bio: 'Suspended for violating terms of service.',
      isActive: false, // Banned user
      emailVerifiedAt: new Date(),
    }
  ];

  const createdUsers = [];
  for (const u of usersToCreate) {
    createdUsers.push(await prisma.user.create({ data: u }));
  }
  console.log(`Created ${usersToCreate.length} regular users.`);

  // Create Categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Web Development',
      slug: 'web-development',
      description: 'Learn to build modern web applications',
    }
  });
  const category2 = await prisma.category.create({
    data: {
      name: 'Data Science',
      slug: 'data-science',
      description: 'Master data analysis, visualization and machine learning',
    }
  });
  console.log('Created categories.');

  // Create Courses
  const course1 = await prisma.course.create({
    data: {
      title: 'Next.js & React Mastery',
      slug: 'nextjs-react-mastery',
      shortDescription: 'Build scalable full-stack applications with Next.js and React.',
      fullDescription: 'This comprehensive course will teach you everything you need to know about Next.js and React...',
      level: 'intermediate',
      price: 49.99,
      status: 'published',
      categoryId: category1.id,
      createdBy: admin.id,
      publishedAt: new Date(),
    }
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Python for Data Science',
      slug: 'python-data-science',
      shortDescription: 'Learn Python programming specifically tailored for Data Science workflows.',
      fullDescription: 'Master pandas, numpy, matplotlib and scikit-learn in this hands-on course.',
      level: 'beginner',
      price: 29.99,
      status: 'published',
      categoryId: category2.id,
      createdBy: admin.id,
      publishedAt: new Date(),
    }
  });
  console.log('Created courses.');

  // Create Sections & Lessons for Course 1
  const section1 = await prisma.section.create({
    data: {
      courseId: course1.id,
      title: 'Getting Started with Next.js',
      orderIndex: 1,
    }
  });

  const lesson1 = await prisma.lesson.create({
    data: {
      sectionId: section1.id,
      title: 'Introduction to Next.js 14',
      contentType: 'video',
      contentUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk', // placeholder
      durationSeconds: 600,
      isPreview: true,
      orderIndex: 1,
    }
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      sectionId: section1.id,
      title: 'App Router Basics',
      contentType: 'video',
      contentUrl: 'https://www.youtube.com/watch?v=Zbrv0a0vH7Q', // placeholder
      durationSeconds: 900,
      isPreview: false,
      orderIndex: 2,
    }
  });

  // Create a Quiz for Lesson 2
  const quiz1 = await prisma.quiz.create({
    data: {
      lessonId: lesson2.id,
      title: 'App Router Knowledge Check',
      description: 'Test your understanding of the new App Router',
      passingScore: 80,
      maxAttempts: 3,
    }
  });

  const q1 = await prisma.question.create({
    data: {
      quizId: quiz1.id,
      questionText: 'What is the default rendering mode in the Next.js App Router?',
      questionType: 'single_choice',
      orderIndex: 1,
    }
  });

  await prisma.questionOption.createMany({
    data: [
      { questionId: q1.id, optionText: 'Client-side rendering', isCorrect: false, orderIndex: 1 },
      { questionId: q1.id, optionText: 'Server Components', isCorrect: true, orderIndex: 2 },
      { questionId: q1.id, optionText: 'Static Site Generation', isCorrect: false, orderIndex: 3 },
    ]
  });

  // Create Coupons
  const coupon1 = await prisma.coupon.create({
    data: {
      code: 'SUMMER2026',
      discountType: 'Percent',
      discountValue: 20,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    }
  });

  const coupon2 = await prisma.coupon.create({
    data: {
      code: 'WELCOME5',
      discountType: 'Fixed',
      discountValue: 5,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      usageLimit: 500,
      usedCount: 15,
      isActive: true,
    }
  });

  console.log('Created sections, lessons, quizzes, and coupons.');

  // Create Enrollments
  await prisma.enrollment.create({
    data: {
      userId: createdUsers[0].id,
      courseId: course1.id,
      status: 'active',
      enrolledAt: new Date(),
    }
  });

  console.log('Created enrollments.');
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

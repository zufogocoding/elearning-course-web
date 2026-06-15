require('dotenv').config();
const prisma = require('../lib/prisma.js');

async function main() {
  console.log('Seeding test course for PayOS...');

  // Get first admin user or first user to be the creator
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No users found in database. Please run npm run seed first.');
    process.exit(1);
  }

  const course = await prisma.course.create({
    data: {
      title: 'PayOS Testing Course',
      slug: 'payos-testing-course-' + Date.now(),
      shortDescription: 'Khóa học giá cực thấp để test thanh toán mã QR của PayOS',
      fullDescription: 'Khóa học này chỉ để phục vụ mục đích kiểm thử tính năng thanh toán của hệ thống.',
      level: 'beginner',
      price: 15000, // 15,000 VND
      discountPrice: 2000, // 2,000 VND (PayOS usually allows min 2,000 VND)
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
      status: 'published',
      createdBy: user.id,
      sections: {
        create: [
          {
            title: 'Phần 1: Test Thanh Toán',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Cảm ơn bạn đã mua khóa học (Demo)',
                  contentType: 'text',
                  durationSeconds: 30,
                  isPreview: false,
                  orderIndex: 1
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('✅ Created Test Course:', course.title);
  console.log('Price:', course.price, 'VND, Discount:', course.discountPrice, 'VND');
  console.log('Slug:', course.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

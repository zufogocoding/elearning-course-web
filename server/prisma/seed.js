require('dotenv').config();
const prisma = require('../lib/prisma.js');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Seeding database...');

  // Clean existing users
  await prisma.user.deleteMany({});
  console.log('Deleted existing users.');

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

  for (const u of usersToCreate) {
    await prisma.user.create({ data: u });
  }
  
  console.log(`Created ${usersToCreate.length} regular users.`);
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

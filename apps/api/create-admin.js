const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const username = 'admin01';
  const passwordHash = '$2b$10$AGaF.8ZnYh1DphIbdAapbuhPO449E9urhL6QXbFAAnfYbqwZrcQGm'; // ← replace with your hash

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    await prisma.user.update({
      where: { username },
      data: { role: 'ADMIN' },
    });
    console.log('User already exists, role updated to ADMIN');
  } else {
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        displayName: 'Admin User',
        role: 'ADMIN',
      },
    });
    console.log('Admin user created');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
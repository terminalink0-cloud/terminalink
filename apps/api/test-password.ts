import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      username: 'admin',
    },
  });

  console.log('USER:', user);

  if (user) {
    const result = await bcrypt.compare(
      'admin123',
      user.passwordHash,
    );

    console.log('PASSWORD CHECK:', result);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
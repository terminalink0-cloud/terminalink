import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    'admin123',
    10,
  );

  const user = await prisma.user.update({
    where: {
      username: 'admin',
    },
    data: {
      passwordHash,
    },
  });

  console.log('UPDATED:', {
    username: user.username,
    role: user.role,
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
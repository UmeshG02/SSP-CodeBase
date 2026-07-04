import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@ssp.com';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: Role.SUPER_ADMIN, passwordHash }
    });
    console.log(`Updated existing user ${email} to SUPER_ADMIN`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.SUPER_ADMIN,
        profile: {
          create: {
            name: 'Platform Administrator',
            username: 'admin',
            college: 'SSP Core',
            expLevel: 'Expert',
          }
        },
        streaks: { create: {} }
      }
    });
    console.log(`Created new admin user: ${email} with password: ${password}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from '@prisma/client';
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

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('Error: User not found in database.');
    return;
  }

  console.log('User found in DB. Role:', user.role);
  console.log('Password hash:', user.passwordHash);

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
  console.log('Is Password Valid check:', isPasswordValid);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

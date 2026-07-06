import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    include: { profile: true }
  });
  console.log('Total users in DB:', users.length);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, HasHash: ${!!u.passwordHash}, Username: ${u.profile?.username}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

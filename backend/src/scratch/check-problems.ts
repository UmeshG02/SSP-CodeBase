import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log('Querying first 15 problems...');
  const res = await prisma.problem.findMany({
    take: 15,
    select: { title: true, slug: true, type: true },
  });
  console.log('Problems in database:', res);
  
  console.log('Querying paths...');
  const paths = await prisma.learningPath.findMany();
  console.log('Paths in database:', paths);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

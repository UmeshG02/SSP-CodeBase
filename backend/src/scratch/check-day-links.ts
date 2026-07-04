import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const day = await prisma.day.findFirst({
    where: { dayNumber: 1, week: { weekNumber: 1 } },
    include: { problems: true },
  });
  
  if (!day) {
    console.log('Day 1 Week 1 not found!');
    return;
  }
  
  console.log('Day 1 Week 1 title:', day.title);
  console.log('Day problems count:', day.problems.length);
  console.log('Slugs checklist:');
  for (const p of day.problems) {
    console.log(`- type: ${p.type}, slug: ${p.slug}`);
    
    // verify if we can fetch it via slug endpoint
    const found = await prisma.problem.findUnique({ where: { slug: p.slug } });
    console.log(`  Verification fetch: ${found ? 'SUCCESS' : 'FAILED'}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient, Difficulty, ChallengeType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting simplified 70-question DB seeding (10 coding questions per week)...');

  // 1. Seed SQL Workspace Tables (Keep sandbox tables populated for playground query support)
  console.log('Re-initializing SQL challenge tables...');
  for (let t = 0; t < 15; t++) {
    const sfx = t === 0 ? '' : `_${t}`;
    await prisma.$executeRawUnsafe(`
      DROP TABLE IF EXISTS sql_users_challenge${sfx} CASCADE;
      DROP TABLE IF EXISTS sql_employees_challenge${sfx} CASCADE;
      DROP TABLE IF EXISTS sql_products_challenge${sfx} CASCADE;

      CREATE TABLE sql_users_challenge${sfx} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        role VARCHAR(20) NOT NULL
      );

      CREATE TABLE sql_employees_challenge${sfx} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        salary INT NOT NULL,
        department VARCHAR(50) NOT NULL
      );

      CREATE TABLE sql_products_challenge${sfx} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        price INT NOT NULL,
        stock INT NOT NULL,
        category VARCHAR(50) NOT NULL
      );
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO sql_users_challenge${sfx} (name, status, role) VALUES
      ('Alice', '${t % 2 === 0 ? 'active' : 'inactive'}', 'Admin'),
      ('Bob', 'inactive', 'User'),
      ('Charlie', 'active', 'User'),
      ('David', '${(t + 1) % 3 === 0 ? 'inactive' : 'active'}', 'Guest'),
      ('Eve', 'inactive', 'User'),
      ('Frank', 'active', 'Admin'),
      ('Grace', '${t % 3 === 0 ? 'inactive' : 'active'}', 'User'),
      ('Heidi', 'inactive', 'User'),
      ('Ivan', 'active', 'Guest'),
      ('Jack', '${t % 4 === 0 ? 'inactive' : 'active'}', 'Admin');

      INSERT INTO sql_employees_challenge${sfx} (name, salary, department) VALUES
      ('Alice', ${80000 + t * 1000}, 'Engineering'),
      ('Bob', ${60000 - t * 500}, 'Engineering'),
      ('Charlie', 45000, 'Marketing'),
      ('David', ${90000 + t * 2000}, 'Finance'),
      ('Eve', 30000, 'HR'),
      ('Frank', ${95000 + t * 1500}, 'Engineering'),
      ('Grace', 52000, 'Marketing'),
      ('Heidi', ${72000 - t * 1000}, 'Finance'),
      ('Ivan', 25000, 'HR'),
      ('Jack', ${105000 + t * 500}, 'Engineering');

      INSERT INTO sql_products_challenge${sfx} (name, price, stock, category) VALUES
      ('Laptop', ${1200 + t * 50}, ${10 + t}, 'Electronics'),
      ('Smartphone', ${800 - t * 20}, ${t % 2 === 0 ? 5 : 0}, 'Electronics'),
      ('Headphones', 150, ${45 - t}, 'Electronics'),
      ('Coffee Maker', 100, ${t % 3 === 0 ? 2 : 0}, 'Home Goods'),
      ('Desk Chair', ${250 + t * 10}, 12, 'Furniture'),
      ('Dining Table', 600, 5, 'Furniture'),
      ('Toaster', 40, 30, 'Home Goods'),
      ('Keyboard', 75, 20, 'Electronics'),
      ('Monitor', 300, 15, 'Electronics'),
      ('Vacuum Cleaner', 180, 8, 'Home Goods'),
      ('Sofa', 900, 2, 'Furniture'),
      ('Bookshelf', 120, 18, 'Furniture');
    `);
  }

  // Clear existing database collections
  console.log('Clearing old problems & structures...');
  await prisma.submission.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.problem.deleteMany({});
  await prisma.userDayProgress.deleteMany({});
  await prisma.userProgress.deleteMany({});
  await prisma.day.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.learningPath.deleteMany({});

  // 2. Setup Learning Path
  console.log('Creating Python Learning Path...');
  const path = await prisma.learningPath.create({
    data: {
      title: 'Python Programming Journey',
      slug: 'python-programming-journey',
      description: 'Master python core concepts, object-oriented design, functional programming, and standard library architectures.',
    }
  });

  const weekTopics = [
    { title: 'Module 1: Introduction to IT & Python Basics', topic: 'IT Basics' },
    { title: 'Module 2: Data Types & Basic Structures', topic: 'Data Types' },
    { title: 'Module 3: Key Structures & Control Flows', topic: 'Control Flow' },
    { title: 'Module 4: Advanced Loops & Functions', topic: 'Functions' },
    { title: 'Module 5: Object-Oriented Programming (OOP)', topic: 'OOP Core' },
    { title: 'Module 6: Advanced OOP & Operations', topic: 'Advanced OOP' },
    { title: 'Module 7: Standard Python Libraries', topic: 'Python Libraries' }
  ];

  const codingTemplates = [
    // 5 Easy (Indices 0 - 4)
    {
      title: 'Basic Sum',
      difficulty: Difficulty.EASY,
      points: 10,
      tags: ['Variables', 'Basic Math'],
      fn: (x: number) => x + 10,
      t1: 'int x',
      t2: 'int',
      desc: 'Write a function `solve(x)` that takes an integer `x` and returns `x + 10`.',
      s0_in: '5',
      s0_out: '15',
      s0_exp: 'For x = 5, the result is 5 + 10 = 15.',
      s1_in: '12',
      s1_out: '22',
      s1_exp: 'For x = 12, the result is 12 + 10 = 22.'
    },
    {
      title: 'Parity Identifier',
      difficulty: Difficulty.EASY,
      points: 10,
      tags: ['Conditionals'],
      fn: (x: number) => x % 2 === 0 ? 'even' : 'odd',
      t1: 'int x',
      t2: 'String',
      desc: 'Write a function `solve(x)` that returns `"even"` if `x` is even, and `"odd"` otherwise.',
      s0_in: '4',
      s0_out: '"even"',
      s0_exp: 'Since 4 is divisible by 2, it is even.',
      s1_in: '7',
      s1_out: '"odd"',
      s1_exp: 'Since 7 is not divisible by 2, it is odd.'
    },
    {
      title: 'Value Tripler',
      difficulty: Difficulty.EASY,
      points: 10,
      tags: ['Basic Math'],
      fn: (x: number) => x * 3,
      t1: 'int x',
      t2: 'int',
      desc: 'Write a function `solve(x)` that returns the value `x * 3`.',
      s0_in: '3',
      s0_out: '9',
      s0_exp: 'For x = 3, the result is 3 * 3 = 9.',
      s1_in: '10',
      s1_out: '30',
      s1_exp: 'For x = 10, the result is 10 * 3 = 30.'
    },
    {
      title: 'Simple Multiplier',
      difficulty: Difficulty.EASY,
      points: 15,
      tags: ['Basic Math'],
      fn: (x: number) => x * 5,
      t1: 'int x',
      t2: 'int',
      desc: 'Write a function `solve(x)` that returns `x * 5`.',
      s0_in: '4',
      s0_out: '20',
      s0_exp: 'For x = 4, the result is 4 * 5 = 20.',
      s1_in: '10',
      s1_out: '50',
      s1_exp: 'For x = 10, the result is 10 * 5 = 50.'
    },
    {
      title: 'Limit Validation',
      difficulty: Difficulty.EASY,
      points: 15,
      tags: ['Conditionals'],
      fn: (x: number) => x >= 50 ? 'true' : 'false',
      t1: 'int x',
      t2: 'String',
      desc: 'Write a function `solve(x)` that returns the string `"true"` if `x` is 50 or above, and `"false"` otherwise.',
      s0_in: '60',
      s0_out: '"true"',
      s0_exp: 'Since 60 is greater than or equal to 50, it returns "true".',
      s1_in: '30',
      s1_out: '"false"',
      s1_exp: 'Since 30 is less than 50, it returns "false".'
    },
    
    // 3 Medium (Indices 5 - 7)
    {
      title: 'Square Progression',
      difficulty: Difficulty.MEDIUM,
      points: 20,
      tags: ['Math'],
      fn: (x: number) => x * x,
      t1: 'int x',
      t2: 'int',
      desc: 'Write a function `solve(x)` that returns the square of the value `x`.',
      s0_in: '5',
      s0_out: '25',
      s0_exp: 'The square of 5 is 5 * 5 = 25.',
      s1_in: '8',
      s1_out: '64',
      s1_exp: 'The square of 8 is 8 * 8 = 64.'
    },
    {
      title: 'Divisibility Checker',
      difficulty: Difficulty.MEDIUM,
      points: 20,
      tags: ['Loops'],
      fn: (x: number) => x % 5 === 0 ? 1 : 0,
      t1: 'int x',
      t2: 'int',
      desc: 'Write a function `solve(x)` that returns `1` if `x` is divisible by 5, and `0` otherwise.',
      s0_in: '15',
      s0_out: '1',
      s0_exp: 'Since 15 is divisible by 5, the function returns 1.',
      s1_in: '12',
      s1_out: '0',
      s1_exp: 'Since 12 is not divisible by 5, the function returns 0.'
    },
    {
      title: 'Sum Accumulator',
      difficulty: Difficulty.MEDIUM,
      points: 25,
      tags: ['Basic Math'],
      fn: (x: number) => (x * (x + 1)) / 2,
      t1: 'int x',
      t2: 'int',
      desc: 'Write a function `solve(x)` that returns the sum of numbers from 1 to `x`.',
      s0_in: '4',
      s0_out: '10',
      s0_exp: 'Sum of integers from 1 to 4 is 1 + 2 + 3 + 4 = 10.',
      s1_in: '5',
      s1_out: '15',
      s1_exp: 'Sum of integers from 1 to 5 is 1 + 2 + 3 + 4 + 5 = 15.'
    },
    
    // 2 Hard (Indices 8 - 9)
    {
      title: 'Cube Boundary',
      difficulty: Difficulty.HARD,
      points: 30,
      tags: ['Math'],
      fn: (x: number) => x * x * x,
      t1: 'int x',
      t2: 'int',
      desc: 'Write a function `solve(x)` that returns the cube of the value `x`.',
      s0_in: '3',
      s0_out: '27',
      s0_exp: 'The cube of 3 is 3 * 3 * 3 = 27.',
      s1_in: '4',
      s1_out: '64',
      s1_exp: 'The cube of 4 is 4 * 4 * 4 = 64.'
    },
    {
      title: 'Fibonacci Bounds',
      difficulty: Difficulty.HARD,
      points: 30,
      tags: ['Recursion', 'Math'],
      fn: (x: number) => x <= 1 ? x : x - 1,
      t1: 'int x',
      t2: 'int',
      desc: 'Write a function `solve(x)` that returns a calculated Fibonacci check bounds for value `x`.',
      s0_in: '1',
      s0_out: '1',
      s0_exp: 'Since x <= 1, it returns x = 1.',
      s1_in: '5',
      s1_out: '4',
      s1_exp: 'Based on custom bounds sequence, it returns 5 - 1 = 4.'
    }
  ];

  console.log('Seeding Weekly Modules...');

  for (let wIdx = 0; wIdx < 7; wIdx++) {
    const week = await prisma.week.create({
      data: {
        pathId: path.id,
        title: weekTopics[wIdx].title,
        weekNumber: wIdx + 1,
        accessKey: `module-${wIdx + 1}-key`,
      }
    });

    // Create 1 backing Day structure per week to maintain DB schema constraints
    const day = await prisma.day.create({
      data: {
        weekId: week.id,
        title: `Week ${wIdx + 1} Challenges`,
        dayNumber: 1,
        objectives: [
          `Master core topics for ${weekTopics[wIdx].topic}`,
          `Solve 10 coding challenges (5 Easy, 3 Medium, 2 Hard)`
        ]
      }
    });

    // Seed exactly 10 coding challenges for this week (attached to the single day child)
    for (let pIdx = 0; pIdx < 10; pIdx++) {
      const tmpl = codingTemplates[pIdx];
      const title = `${weekTopics[wIdx].topic}: ${tmpl.title}`;
      const slug = `coding-w${wIdx + 1}-p${pIdx + 1}`;
      
      const problemDescription = `# ${title}

${tmpl.desc}

### Function Description
Complete the \`solve\` function in the editor below.

solve has the following parameters:
* \`${tmpl.t1}\`: input parameter

### Returns
* \`${tmpl.t2}\`: evaluated response

### Sample Input 0
\`\`\`
${tmpl.s0_in}
\`\`\`

### Sample Output 0
\`\`\`
${tmpl.s0_out}
\`\`\`

### Explanation 0
${tmpl.s0_exp}

### Sample Input 1
\`\`\`
${tmpl.s1_in}
\`\`\`

### Sample Output 1
\`\`\`
${tmpl.s1_out}
\`\`\`

### Explanation 1
${tmpl.s1_exp}`;

      const problem = await prisma.problem.create({
        data: {
          title,
          slug,
          description: problemDescription,
          difficulty: tmpl.difficulty,
          type: ChallengeType.CODING,
          points: tmpl.points,
          tags: tmpl.tags,
          dayId: day.id,
          inputFormat: 'Single parameter input',
          outputFormat: 'Evaluated response',
          templateCode: JSON.stringify({
            javascript: 'function solve(x) {\n  // Write your code here\n}',
            typescript: 'function solve(x: number): any {\n  // Write your code here\n}',
            python: 'def solve(x):\n    # Write your code here\n    pass',
            java: `class Solution {\n    public ${tmpl.t2 === 'int' ? 'int' : 'String'} solve(int x) {\n        // Write your code here\n        return ${tmpl.t2 === 'int' ? '0' : '""'};\n    }\n}`,
            cpp: `class Solution {\npublic:\n    ${tmpl.t2 === 'int' ? 'int' : 'string'} solve(int x) {\n        // Write your code here\n        return ${tmpl.t2 === 'int' ? '0' : '""'};\n    }\n};`
          })
        }
      });

      // Seed 5 testcases for this coding question
      const testCases: any[] = [];
      for (let t = 0; t < 5; t++) {
        const inputVal = (t + 1) * (pIdx + 2) + wIdx;
        const expectedVal = tmpl.fn(inputVal);
        testCases.push({
          problemId: problem.id,
          input: `${inputVal}`,
          expected: typeof expectedVal === 'number' ? `${expectedVal}` : `"${expectedVal}"`,
          isSample: t < 2,
        });
      }
      await prisma.testCase.createMany({ data: testCases });
    }
  }

  console.log('Seeding standalone practice problems (two-sum, palindrome-number)...');
  
  const pTwoSum = await prisma.problem.create({
    data: {
      title: 'Two Sum',
      slug: 'two-sum',
      description: `# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

You can return the answer in any order.

### Input Format
An array of integers \`nums\` and target integer \`target\`.

### Output Format
Indices of the two elements as a JSON list.`,
      difficulty: Difficulty.EASY,
      type: ChallengeType.CODING,
      points: 20,
      tags: ['Arrays', 'Hash Table'],
      inputFormat: 'Array of integers nums and target value',
      outputFormat: 'JSON list of indices',
      templateCode: JSON.stringify({
        javascript: 'function solve(nums, target) {\n  // Write your code here\n}',
        typescript: 'function solve(nums: number[], target: number): number[] {\n  // Write your code here\n}',
        python: 'def solve(nums, target):\n    # Write your code here\n    pass',
        java: 'class Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your code here\n        return new int[]{0, 0};\n    }\n}',
        cpp: 'class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};'
      })
    }
  });

  await prisma.testCase.createMany({
    data: [
      { problemId: pTwoSum.id, input: '[2,7,11,15]\n9', expected: '[0,1]', isSample: true },
      { problemId: pTwoSum.id, input: '[3,2,4]\n6', expected: '[1,2]', isSample: true },
      { problemId: pTwoSum.id, input: '[3,3]\n6', expected: '[0,1]', isSample: false }
    ]
  });

  const pPalindrome = await prisma.problem.create({
    data: {
      title: 'Palindrome Number',
      slug: 'palindrome-number',
      description: `# Palindrome Number

Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise.

### Input Format
Single integer \`x\`.

### Output Format
Return string \`true\` or \`false\`.`,
      difficulty: Difficulty.EASY,
      type: ChallengeType.CODING,
      points: 15,
      tags: ['Math'],
      inputFormat: 'Integer x',
      outputFormat: 'Boolean string',
      templateCode: JSON.stringify({
        javascript: 'function solve(x) {\n  // Write your code here\n}',
        typescript: 'function solve(x: number): boolean {\n  // Write your code here\n}',
        python: 'def solve(x):\n    # Write your code here\n    pass',
        java: 'class Solution {\n    public boolean solve(int x) {\n        // Write your code here\n        return false;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    bool solve(int x) {\n        // Write your code here\n        return false;\n    }\n};'
      })
    }
  });

  await prisma.testCase.createMany({
    data: [
      { problemId: pPalindrome.id, input: '121', expected: 'true', isSample: true },
      { problemId: pPalindrome.id, input: '-121', expected: 'false', isSample: true },
      { problemId: pPalindrome.id, input: '10', expected: 'false', isSample: false }
    ]
  });

  console.log('✨ Guided weekly learning database seed complete successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

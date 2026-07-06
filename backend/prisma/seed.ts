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

  const weekData = [
    // WEEK 1: IT Basics (Introduction to IT & Python Basics)
    {
      topic: 'IT Basics',
      templates: [
        {
          title: 'Fahrenheit to Celsius',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Variables', 'Math'],
          t1: 'int fahrenheit',
          t2: 'int',
          desc: 'Given a temperature in Fahrenheit, convert it to Celsius using the formula: C = (F - 32) * 5/9.',
          s0_in: '77',
          s0_out: '25',
          s0_exp: 'C = (77 - 32) * 5/9 = 25.',
          s1_in: '32',
          s1_out: '0',
          s1_exp: 'C = (32 - 32) * 5/9 = 0.',
          fn: (f: number) => Math.round((f - 32) * 5 / 9)
        },
        {
          title: 'Simple Interest',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Variables', 'Math'],
          t1: 'int principal',
          t2: 'int',
          desc: 'Calculate Simple Interest given Principal P = input, Rate R = 5%, and Time T = 2 years. Formula: SI = (P * R * T) / 100.',
          s0_in: '1000',
          s0_out: '100',
          s0_exp: 'SI = (1000 * 5 * 2) / 100 = 100.',
          s1_in: '500',
          s1_out: '50',
          s1_exp: 'SI = (500 * 5 * 2) / 100 = 50.',
          fn: (p: number) => Math.round((p * 5 * 2) / 100)
        },
        {
          title: 'Seconds to Minutes',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Variables'],
          t1: 'int seconds',
          t2: 'int',
          desc: 'Convert input seconds into complete minutes (integer division).',
          s0_in: '180',
          s0_out: '3',
          s0_exp: '180 seconds is 3 minutes.',
          s1_in: '50',
          s1_out: '0',
          s1_exp: '50 seconds is 0 full minutes.',
          fn: (s: number) => Math.floor(s / 60)
        },
        {
          title: 'String Multiplier',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Strings'],
          t1: 'int count',
          t2: 'String',
          desc: 'Generate a string containing the word "Code" repeated `count` times.',
          s0_in: '3',
          s0_out: 'CodeCodeCode',
          s0_exp: '"Code" repeated 3 times.',
          s1_in: '1',
          s1_out: 'Code',
          s1_exp: '"Code" repeated 1 time.',
          fn: (c: number) => 'Code'.repeat(c)
        },
        {
          title: 'Circle Area Calculator',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Math'],
          t1: 'int radius',
          t2: 'int',
          desc: 'Given the radius of a circle, calculate its area rounded to the nearest integer. Use pi = 3.14.',
          s0_in: '10',
          s0_out: '314',
          s0_exp: 'Area = 3.14 * 10 * 10 = 314.',
          s1_in: '5',
          s1_out: '79',
          s1_exp: 'Area = 3.14 * 5 * 5 = 78.5, rounded to 79.',
          fn: (r: number) => Math.round(3.14 * r * r)
        },
        {
          title: 'Leap Year Indicator',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Conditionals'],
          t1: 'int year',
          t2: 'int',
          desc: 'Check if a year is a leap year. Return 1 if true, 0 if false. A leap year is divisible by 4, but not by 100 unless also divisible by 400.',
          s0_in: '2024',
          s0_out: '1',
          s0_exp: '2024 is divisible by 4 and not by 100, so it is a leap year.',
          s1_in: '1900',
          s1_out: '0',
          s1_exp: '1900 is divisible by 100 but not by 400, so it is not a leap year.',
          fn: (y: number) => (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 1 : 0
        },
        {
          title: 'String Padder',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Strings'],
          t1: 'int x',
          t2: 'String',
          desc: 'Convert the input number `x` to a string and return it padded with leading zeros up to a length of 5 characters.',
          s0_in: '42',
          s0_out: '00042',
          s0_exp: 'Padded to 5 chars with leading zeros.',
          s1_in: '123456',
          s1_out: '123456',
          s1_exp: 'Already longer than 5 chars, so returned as is.',
          fn: (x: number) => String(x).padStart(5, '0')
        },
        {
          title: 'Even Digits Sum',
          difficulty: Difficulty.MEDIUM,
          points: 25,
          tags: ['Math', 'Loops'],
          t1: 'int x',
          t2: 'int',
          desc: 'Calculate the sum of all even digits in the positive integer `x`.',
          s0_in: '24578',
          s0_out: '14',
          s0_exp: 'Even digits are 2, 4, 8. Sum is 2 + 4 + 8 = 14.',
          s1_in: '1357',
          s1_out: '0',
          s1_exp: 'No even digits exist, so sum is 0.',
          fn: (x: number) => String(x).split('').map(Number).filter(d => d % 2 === 0).reduce((a, b) => a + b, 0)
        },
        {
          title: 'Digit Product Root',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Loops', 'Math'],
          t1: 'int x',
          t2: 'int',
          desc: 'Find the product of all digits of `x`. If the product is greater than 9, repeat the process until a single digit is obtained.',
          s0_in: '39',
          s0_out: '4',
          s0_exp: 'Product of digits is 3 * 9 = 27. Repeated: 2 * 7 = 14. Repeated: 1 * 4 = 4.',
          s1_in: '5',
          s1_out: '5',
          s1_exp: 'Single digit already.',
          fn: (x: number) => {
            let num = x;
            while (num > 9) {
              num = String(num).split('').map(Number).reduce((a, b) => a * b, 1);
            }
            return num;
          }
        },
        {
          title: 'Collatz Sequence Length',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Recursion', 'Math'],
          t1: 'int x',
          t2: 'int',
          desc: 'Return the number of steps required to reach 1 from `x` under the Collatz Conjecture (3x + 1 rule).',
          s0_in: '6',
          s0_out: '8',
          s0_exp: '6 -> 3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1 (8 steps)',
          s1_in: '1',
          s1_out: '0',
          s1_exp: 'Already at 1 (0 steps)',
          fn: (x: number) => {
            let steps = 0;
            let temp = x;
            while (temp > 1) {
              if (temp % 2 === 0) temp = temp / 2;
              else temp = temp * 3 + 1;
              steps++;
            }
            return steps;
          }
        }
      ]
    },
    // WEEK 2: Data Types (Data Types & Basic Structures)
    {
      topic: 'Data Types',
      templates: [
        {
          title: 'List Element Search',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Lists'],
          t1: 'int target',
          t2: 'int',
          desc: 'Given a target integer, check if it exists in the preset list [10, 20, 30, 40, 50]. Return 1 if it exists, 0 otherwise.',
          s0_in: '20',
          s0_out: '1',
          s0_exp: '20 exists in [10, 20, 30, 40, 50].',
          s1_in: '25',
          s1_out: '0',
          s1_exp: '25 does not exist in [10, 20, 30, 40, 50].',
          fn: (t: number) => [10, 20, 30, 40, 50].includes(t) ? 1 : 0
        },
        {
          title: 'List Element Extractor',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Lists'],
          t1: 'int index',
          t2: 'int',
          desc: 'Return the element at the given `index` (0-indexed) from the list [5, 12, 19, 26, 33, 40]. If out of bounds, return -1.',
          s0_in: '2',
          s0_out: '19',
          s0_exp: 'Element at index 2 of [5, 12, 19, 26, 33, 40] is 19.',
          s1_in: '10',
          s1_out: '-1',
          s1_exp: 'Index 10 is out of bounds, so returns -1.',
          fn: (idx: number) => {
            const list = [5, 12, 19, 26, 33, 40];
            return (idx >= 0 && idx < list.length) ? list[idx] : -1;
          }
        },
        {
          title: 'Dictionary Key Value',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Dictionaries'],
          t1: 'int x',
          t2: 'int',
          desc: 'Look up the key `x` in the dictionary {1: 100, 2: 200, 3: 300, 4: 400}. Return the value if found, or 0 if not found.',
          s0_in: '3',
          s0_out: '300',
          s0_exp: 'Key 3 has value 300.',
          s1_in: '5',
          s1_out: '0',
          s1_exp: 'Key 5 does not exist, so returns 0.',
          fn: (x: number) => {
            const dict: Record<number, number> = { 1: 100, 2: 200, 3: 300, 4: 400 };
            return dict[x] || 0;
          }
        },
        {
          title: 'Squares Sum Array',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Lists'],
          t1: 'int length',
          t2: 'int',
          desc: 'Given a length `n` (1-5), return the sum of elements of a list of squares of size `n` (e.g. for n=3, list is [1, 4, 9], sum is 14).',
          s0_in: '3',
          s0_out: '14',
          s0_exp: 'List of squares is [1, 4, 9]. Sum is 1 + 4 + 9 = 14.',
          s1_in: '2',
          s1_out: '5',
          s1_exp: 'List of squares is [1, 4]. Sum is 1 + 4 = 5.',
          fn: (n: number) => Array.from({ length: n }, (_, i) => (i + 1) ** 2).reduce((a, b) => a + b, 0)
        },
        {
          title: 'Set Unique Checker',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Sets'],
          t1: 'int x',
          t2: 'int',
          desc: 'Given a digit `x`, count how many unique digits exist in `x` (e.g. 11223 has 3 unique digits).',
          s0_in: '11223',
          s0_out: '3',
          s0_exp: 'Digits in 11223 are {1, 2, 3}, which has size 3.',
          s1_in: '777',
          s1_out: '1',
          s1_exp: 'Digits in 777 are {7}, which has size 1.',
          fn: (x: number) => new Set(String(x).split('')).size
        },
        {
          title: 'List Element Frequency',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Dictionaries'],
          t1: 'int digit',
          t2: 'int',
          desc: 'Count the frequency of the given `digit` inside the integer 1122334445.',
          s0_in: '4',
          s0_out: '3',
          s0_exp: 'Digit 4 appears 3 times in 1122334445.',
          s1_in: '9',
          s1_out: '0',
          s1_exp: 'Digit 9 appears 0 times in 1122334445.',
          fn: (d: number) => String(1122334445).split('').filter(char => char === String(d)).length
        },
        {
          title: 'Set Difference Sum',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Sets'],
          t1: 'int limit',
          t2: 'int',
          desc: 'Given a limit `n` (1 to 20), find the sum of all elements in the set of numbers from 1 to `n` that are NOT divisible by 3.',
          s0_in: '5',
          s0_out: '12',
          s0_exp: 'Numbers are [1, 2, 4, 5] (3 is excluded). Sum is 1 + 2 + 4 + 5 = 12.',
          s1_in: '3',
          s1_out: '3',
          s1_exp: 'Numbers are [1, 2] (3 is excluded). Sum is 1 + 2 = 3.',
          fn: (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter(v => v % 3 !== 0).reduce((a, b) => a + b, 0)
        },
        {
          title: 'List Second Maximum',
          difficulty: Difficulty.MEDIUM,
          points: 25,
          tags: ['Lists'],
          t1: 'int size',
          t2: 'int',
          desc: 'Given a multiplier `size`, generate list [size*1, size*3, size*2, size*5, size*4]. Find the second largest number in it.',
          s0_in: '2',
          s0_out: '8',
          s0_exp: 'Generated list: [2, 6, 4, 10, 8]. Sorted: [10, 8, 6, 4, 2]. Second largest is 8.',
          s1_in: '5',
          s1_out: '20',
          s1_exp: 'Generated list: [5, 15, 10, 25, 20]. Sorted: [25, 20, 15, 10, 5]. Second largest is 20.',
          fn: (s: number) => {
            const arr = [s * 1, s * 3, s * 2, s * 5, s * 4];
            arr.sort((a, b) => b - a);
            return arr[1];
          }
        },
        {
          title: 'Matrix Diagonal Sum',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Lists'],
          t1: 'int multiplier',
          t2: 'int',
          desc: 'Generate a 3x3 matrix where cell (r, c) contains `(r+c)*multiplier` (0-indexed). Find the sum of both the main and secondary diagonal elements.',
          s0_in: '2',
          s0_out: '24',
          s0_exp: 'Matrix with multiplier 2: [[0, 2, 4], [2, 4, 6], [4, 6, 8]]. Diagonals are [0, 4, 8] and [4, 4, 4]. Sum = 0+4+8+4+4 = 24.',
          s1_in: '1',
          s1_out: '12',
          s1_exp: 'Matrix with multiplier 1: [[0, 1, 2], [1, 2, 3], [2, 3, 4]]. Diagonals are [0, 2, 4] and [2, 2, 2]. Sum = 0+2+4+2+2 = 12.',
          fn: (m: number) => {
            const cells = [
              [0, 1 * m, 2 * m],
              [1 * m, 2 * m, 3 * m],
              [2 * m, 3 * m, 4 * m]
            ];
            return cells[0][0] + cells[1][1] + cells[2][2] + cells[0][2] + cells[2][0];
          }
        },
        {
          title: 'Key Frequency Maximum',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Dictionaries'],
          t1: 'int x',
          t2: 'int',
          desc: 'Given the digits of `x`, return the digit that appears most frequently. If there is a tie, return the largest digit.',
          s0_in: '55666',
          s0_out: '6',
          s0_exp: 'Digit 6 appears 3 times, digit 5 appears 2 times. Most frequent is 6.',
          s1_in: '1122',
          s1_out: '2',
          s1_exp: 'Tied count of 2. Return the larger digit, which is 2.',
          fn: (x: number) => {
            const counts: Record<string, number> = {};
            for (const char of String(x)) {
              counts[char] = (counts[char] || 0) + 1;
            }
            let maxCount = 0;
            let maxDigit = 0;
            for (const [digit, count] of Object.entries(counts)) {
              const dVal = Number(digit);
              if (count > maxCount || (count === maxCount && dVal > maxDigit)) {
                maxCount = count;
                maxDigit = dVal;
              }
            }
            return maxDigit;
          }
        }
      ]
    },
    // WEEK 3: Control Flow (Key Structures & Control Flows)
    {
      topic: 'Control Flow',
      templates: [
        {
          title: 'Number Parity Sign',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Conditionals'],
          t1: 'int x',
          t2: 'String',
          desc: 'Return "positive_even" if x is positive and even, "positive_odd" if x is positive and odd, and "zero_or_negative" otherwise.',
          s0_in: '6',
          s0_out: 'positive_even',
          s0_exp: '6 is greater than 0 and divisible by 2.',
          s1_in: '-3',
          s1_out: 'zero_or_negative',
          s1_exp: '-3 is less than or equal to 0.',
          fn: (x: number) => x > 0 ? (x % 2 === 0 ? 'positive_even' : 'positive_odd') : 'zero_or_negative'
        },
        {
          title: 'Buzz Fizz Game',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Conditionals'],
          t1: 'int x',
          t2: 'String',
          desc: 'Return "Fizz" if x is divisible by 3, "Buzz" if x is divisible by 5, "FizzBuzz" if divisible by both, or the string representation of x otherwise.',
          s0_in: '15',
          s0_out: 'FizzBuzz',
          s0_exp: '15 is divisible by both 3 and 5.',
          s1_in: '7',
          s1_out: '7',
          s1_exp: '7 is not divisible by 3 or 5, so returned as is.',
          fn: (x: number) => {
            if (x % 3 === 0 && x % 5 === 0) return 'FizzBuzz';
            if (x % 3 === 0) return 'Fizz';
            if (x % 5 === 0) return 'Buzz';
            return String(x);
          }
        },
        {
          title: 'Grade Classifier',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Conditionals'],
          t1: 'int score',
          t2: 'String',
          desc: 'Given a score, return "A" for 90+, "B" for 80-89, "C" for 70-79, and "F" for below 70.',
          s0_in: '95',
          s0_out: 'A',
          s0_exp: '95 is 90 or above.',
          s1_in: '72',
          s1_out: 'C',
          s1_exp: '72 lies in the 70-79 range.',
          fn: (s: number) => {
            if (s >= 90) return 'A';
            if (s >= 80) return 'B';
            if (s >= 70) return 'C';
            return 'F';
          }
        },
        {
          title: 'Loop Range Sum',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Loops'],
          t1: 'int n',
          t2: 'int',
          desc: 'Calculate the sum of all odd integers from 1 up to `n` inclusive.',
          s0_in: '5',
          s0_out: '9',
          s0_exp: 'Odd numbers up to 5 are 1, 3, 5. Sum is 1 + 3 + 5 = 9.',
          s1_in: '2',
          s1_out: '1',
          s1_exp: 'Odd numbers up to 2 is just 1. Sum is 1.',
          fn: (n: number) => {
            let sum = 0;
            for (let i = 1; i <= n; i++) {
              if (i % 2 !== 0) sum += i;
            }
            return sum;
          }
        },
        {
          title: 'Quadratic Root Count',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Conditionals'],
          t1: 'int d',
          t2: 'int',
          desc: 'Given the discriminant `d` of a quadratic equation, return 2 if d > 0, 1 if d == 0, and 0 if d < 0.',
          s0_in: '10',
          s0_out: '2',
          s0_exp: 'd = 10 is positive.',
          s1_in: '-5',
          s1_out: '0',
          s1_exp: 'd = -5 is negative.',
          fn: (d: number) => d > 0 ? 2 : (d === 0 ? 1 : 0)
        },
        {
          title: 'Prime Validation',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Loops'],
          t1: 'int x',
          t2: 'int',
          desc: 'Return 1 if `x` is a prime number, and 0 otherwise. (x >= 2).',
          s0_in: '17',
          s0_out: '1',
          s0_exp: '17 has no positive divisors other than 1 and itself.',
          s1_in: '9',
          s1_out: '0',
          s1_exp: '9 is divisible by 3.',
          fn: (x: number) => {
            if (x < 2) return 0;
            for (let i = 2; i <= Math.sqrt(x); i++) {
              if (x % i === 0) return 0;
            }
            return 1;
          }
        },
        {
          title: 'GCD Calculator',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Loops'],
          t1: 'int val',
          t2: 'int',
          desc: 'Calculate the Greatest Common Divisor of `val` and 36.',
          s0_in: '24',
          s0_out: '12',
          s0_exp: 'Common factors of 24 and 36: largest is 12.',
          s1_in: '5',
          s1_out: '1',
          s1_exp: '5 is prime, gcd with 36 is 1.',
          fn: (val: number) => {
            let a = val;
            let b = 36;
            while (b !== 0) {
              const temp = b;
              b = a % b;
              a = temp;
            }
            return a;
          }
        },
        {
          title: 'Armstrong Number Checker',
          difficulty: Difficulty.MEDIUM,
          points: 25,
          tags: ['Conditionals', 'Loops'],
          t1: 'int x',
          t2: 'int',
          desc: 'Check if `x` is an Armstrong number (sum of its own digits raised to the power of number of digits equals the number). Return 1 if true, 0 otherwise.',
          s0_in: '153',
          s0_out: '1',
          s0_exp: '3 digits. 1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153.',
          s1_in: '120',
          s1_out: '0',
          s1_exp: '3 digits. 1^3 + 2^3 + 0^3 = 1 + 8 + 0 = 9 != 120.',
          fn: (x: number) => {
            const str = String(x);
            const power = str.length;
            const sum = str.split('').map(Number).reduce((acc, digit) => acc + digit ** power, 0);
            return sum === x ? 1 : 0;
          }
        },
        {
          title: 'Factorial Digit Sum',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Loops', 'Math'],
          t1: 'int x',
          t2: 'int',
          desc: 'Find the factorial of `x` (x <= 12), and return the sum of the digits of the result.',
          s0_in: '5',
          s0_out: '3',
          s0_exp: '5! = 120. Sum of digits = 1 + 2 + 0 = 3.',
          s1_in: '3',
          s1_out: '6',
          s1_exp: '3! = 6. Sum of digits = 6.',
          fn: (x: number) => {
            let fact = 1;
            for (let i = 2; i <= x; i++) fact *= i;
            return String(fact).split('').map(Number).reduce((a, b) => a + b, 0);
          }
        },
        {
          title: 'Perfect Number Search',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Loops'],
          t1: 'int x',
          t2: 'int',
          desc: 'Check if `x` is a perfect number (sum of its proper positive divisors is equal to the number). Return 1 if true, 0 otherwise.',
          s0_in: '6',
          s0_out: '1',
          s0_exp: 'Divisors of 6 are 1, 2, 3. Sum = 1 + 2 + 3 = 6.',
          s1_in: '10',
          s1_out: '0',
          s1_exp: 'Divisors of 10 are 1, 2, 5. Sum = 1 + 2 + 5 = 8 != 10.',
          fn: (x: number) => {
            if (x <= 1) return 0;
            let sum = 1;
            for (let i = 2; i <= Math.sqrt(x); i++) {
              if (x % i === 0) {
                sum += i;
                const counterpart = x / i;
                if (counterpart !== i) sum += counterpart;
              }
            }
            return sum === x ? 1 : 0;
          }
        }
      ]
    },
    // WEEK 4: Functions (Advanced Loops & Functions)
    {
      topic: 'Functions',
      templates: [
        {
          title: 'Volume of Sphere',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Functions', 'Math'],
          t1: 'int radius',
          t2: 'int',
          desc: 'Calculate the volume of a sphere given integer radius: V = 4/3 * pi * r^3. Round to the nearest integer. Use pi = 3.',
          s0_in: '3',
          s0_out: '108',
          s0_exp: 'V = (4/3) * 3 * 27 = 108.',
          s1_in: '2',
          s1_out: '32',
          s1_exp: 'V = (4/3) * 3 * 8 = 32.',
          fn: (r: number) => Math.round((4 / 3) * 3 * (r ** 3))
        },
        {
          title: 'Check Even Odd',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Functions'],
          t1: 'int x',
          t2: 'int',
          desc: 'Write a helper function to determine if x is even. Return 1 if even, 0 if odd.',
          s0_in: '12',
          s0_out: '1',
          s0_exp: '12 is even.',
          s1_in: '5',
          s1_out: '0',
          s1_exp: '5 is odd.',
          fn: (x: number) => x % 2 === 0 ? 1 : 0
        },
        {
          title: 'Fibonacci Term',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Functions'],
          t1: 'int n',
          t2: 'int',
          desc: 'Return the n-th Fibonacci number (0-indexed: fib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, etc.). n <= 25.',
          s0_in: '5',
          s0_out: '5',
          s0_exp: 'Fibonacci sequence: 0, 1, 1, 2, 3, 5...',
          s1_in: '6',
          s1_out: '8',
          s1_exp: 'Term after 5 is 8.',
          fn: (n: number) => {
            if (n <= 0) return 0;
            if (n === 1) return 1;
            let a = 0, b = 1;
            for (let i = 2; i <= n; i++) {
              const next = a + b;
              a = b;
              b = next;
            }
            return b;
          }
        },
        {
          title: 'Double Multiplier Function',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Functions'],
          t1: 'int x',
          t2: 'int',
          desc: 'Return 2 * x + 10.',
          s0_in: '5',
          s0_out: '20',
          s0_exp: '2 * 5 + 10 = 20.',
          s1_in: '0',
          s1_out: '10',
          s1_exp: '2 * 0 + 10 = 10.',
          fn: (x: number) => 2 * x + 10
        },
        {
          title: 'Celsius to Fahrenheit',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Functions'],
          t1: 'int celsius',
          t2: 'int',
          desc: 'Convert Celsius to Fahrenheit using formula: F = (C * 9/5) + 32.',
          s0_in: '25',
          s0_out: '77',
          s0_exp: '(25 * 9/5) + 32 = 77.',
          s1_in: '0',
          s1_out: '32',
          s1_exp: '(0 * 9/5) + 32 = 32.',
          fn: (c: number) => Math.round((c * 9 / 5) + 32)
        },
        {
          title: 'Recursive Factorial',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Recursion'],
          t1: 'int x',
          t2: 'int',
          desc: 'Find the factorial of `x` using a recursive implementation. (x <= 10).',
          s0_in: '4',
          s0_out: '24',
          s0_exp: '4 * 3 * 2 * 1 = 24.',
          s1_in: '1',
          s1_out: '1',
          s1_exp: 'Factorial of 1 is 1.',
          fn: (x: number) => {
            const f = (n: number): number => n <= 1 ? 1 : n * f(n - 1);
            return f(x);
          }
        },
        {
          title: 'Pascal Value Generator',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Functions'],
          t1: 'int row',
          t2: 'int',
          desc: 'Find the sum of all elements in the given row of Pascal\'s Triangle (0-indexed). Formula: sum = 2^row.',
          s0_in: '4',
          s0_out: '16',
          s0_exp: 'Row 4 sum is 2^4 = 16.',
          s1_in: '0',
          s1_out: '1',
          s1_exp: 'Row 0 sum is 2^0 = 1.',
          fn: (r: number) => 2 ** r
        },
        {
          title: 'Sum of Digit Factorials',
          difficulty: Difficulty.MEDIUM,
          points: 25,
          tags: ['Functions', 'Loops'],
          t1: 'int x',
          t2: 'int',
          desc: 'Find the sum of the factorials of all digits of `x` (e.g. for 145, sum is 1! + 4! + 5! = 1 + 24 + 120 = 145).',
          s0_in: '145',
          s0_out: '145',
          s0_exp: '1! + 4! + 5! = 1 + 24 + 120 = 145.',
          s1_in: '23',
          s1_out: '8',
          s1_exp: '2! + 3! = 2 + 6 = 8.',
          fn: (x: number) => {
            const fact = (n: number): number => n <= 1 ? 1 : n * fact(n - 1);
            return String(x).split('').map(Number).map(fact).reduce((a, b) => a + b, 0);
          }
        },
        {
          title: 'Recursive Digit Root',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Recursion'],
          t1: 'int x',
          t2: 'int',
          desc: 'Recursively sum the digits of `x` until a single digit is achieved.',
          s0_in: '9875',
          s0_out: '2',
          s0_exp: '9+8+7+5 = 29. 2+9 = 11. 1+1 = 2.',
          s1_in: '9',
          s1_out: '9',
          s1_exp: 'Already single digit.',
          fn: (x: number) => {
            const sumD = (n: number): number => {
              if (n < 10) return n;
              return sumD(String(n).split('').map(Number).reduce((a, b) => a + b, 0));
            };
            return sumD(x);
          }
        },
        {
          title: 'Binary Pattern Count',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Functions', 'Math'],
          t1: 'int x',
          t2: 'int',
          desc: 'Given decimal integer `x`, convert it to binary. Count the number of non-overlapping "101" patterns in the binary string.',
          s0_in: '21',
          s0_out: '2',
          s0_exp: '21 in binary is 10101. Patterns: (101)01 and 10(101). Count of non-overlapping is 2.',
          s1_in: '5',
          s1_out: '1',
          s1_exp: '5 in binary is 101 (1 pattern).',
          fn: (x: number) => {
            const binary = x.toString(2);
            let count = 0;
            let i = 0;
            while (i <= binary.length - 3) {
              if (binary.substring(i, i + 3) === '101') {
                count++;
                i += 3;
              } else {
                i++;
              }
            }
            return count;
          }
        }
      ]
    },
    // WEEK 5: OOP Core (Object-Oriented Programming)
    {
      topic: 'OOP Core',
      templates: [
        {
          title: 'Box Class Volume',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['OOP'],
          t1: 'int side',
          t2: 'int',
          desc: 'Construct a class `Box` with attribute `side` = input. Define a method `getVolume()` that returns side * side * side.',
          s0_in: '4',
          s0_out: '64',
          s0_exp: 'Volume = 4^3 = 64.',
          s1_in: '2',
          s1_out: '8',
          s1_exp: 'Volume = 2^3 = 8.',
          fn: (s: number) => s * s * s
        },
        {
          title: 'Class Attribute Setter',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['OOP'],
          t1: 'int age',
          t2: 'int',
          desc: 'Construct a class `Person` with attribute `age`. A method `isAdult()` returns 1 if age >= 18, and 0 otherwise.',
          s0_in: '20',
          s0_out: '1',
          s0_exp: '20 is >= 18.',
          s1_in: '16',
          s1_out: '0',
          s1_exp: '16 is < 18.',
          fn: (a: number) => a >= 18 ? 1 : 0
        },
        {
          title: 'Rectangle Perimeter Class',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['OOP'],
          t1: 'int width',
          t2: 'int',
          desc: 'Given the width as input, create a Rectangle class with height = 10. Return the perimeter: 2 * (width + height).',
          s0_in: '5',
          s0_out: '30',
          s0_exp: '2 * (5 + 10) = 30.',
          s1_in: '10',
          s1_out: '40',
          s1_exp: '2 * (10 + 10) = 40.',
          fn: (w: number) => 2 * (w + 10)
        },
        {
          title: 'Inherited Add Sub',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['OOP'],
          t1: 'int x',
          t2: 'int',
          desc: 'Create a base class `A` that returns x. Inherited class `B` overrides the method to return x + 100. Return B\'s response.',
          s0_in: '5',
          s0_out: '105',
          s0_exp: '5 + 100 = 105.',
          s1_in: '-10',
          s1_out: '90',
          s1_exp: '-10 + 100 = 90.',
          fn: (x: number) => x + 100
        },
        {
          title: 'Employee Bonus Calculator',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['OOP'],
          t1: 'int salary',
          t2: 'int',
          desc: 'Create a class `Employee` with `salary`. Method `getBonus()` returns 10% of the salary.',
          s0_in: '5000',
          s0_out: '500',
          s0_exp: '10% of 5000 is 500.',
          s1_in: '1200',
          s1_out: '120',
          s1_exp: '10% of 1200 is 120.',
          fn: (s: number) => Math.round(s * 0.1)
        },
        {
          title: 'Point Coordinate Distance',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['OOP'],
          t1: 'int x',
          t2: 'int',
          desc: 'Create a class `Point` with coords (x, 0). Method `distanceToOrigin()` returns x * x.',
          s0_in: '5',
          s0_out: '25',
          s0_exp: 'Distance squared is 5*5 = 25.',
          s1_in: '-4',
          s1_out: '16',
          s1_exp: 'Distance squared is (-4)*(-4) = 16.',
          fn: (x: number) => x * x
        },
        {
          title: 'Bank Interest Accumulator',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['OOP'],
          t1: 'int balance',
          t2: 'int',
          desc: 'Class `Account` initialized with `balance`. Method `applyInterest()` returns balance * 1.05 rounded to the nearest integer.',
          s0_in: '1000',
          s0_out: '1050',
          s0_exp: '1000 * 1.05 = 1050.',
          s1_in: '500',
          s1_out: '525',
          s1_exp: '500 * 1.05 = 525.',
          fn: (b: number) => Math.round(b * 1.05)
        },
        {
          title: 'Encapsulated Student Scores',
          difficulty: Difficulty.MEDIUM,
          points: 25,
          tags: ['OOP'],
          t1: 'int score',
          t2: 'String',
          desc: 'Class `Student` with private attribute `_score`. If score is updated to > 100, normalize it to 100. Get score and return "Passed" if score >= 40, else "Failed".',
          s0_in: '85',
          s0_out: 'Passed',
          s0_exp: '85 is >= 40.',
          s1_in: '35',
          s1_out: 'Failed',
          s1_exp: '35 is < 40.',
          fn: (s: number) => {
            const finalScore = s > 100 ? 100 : s;
            return finalScore >= 40 ? 'Passed' : 'Failed';
          }
        },
        {
          title: 'Method Chaining Class',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['OOP'],
          t1: 'int initialValue',
          t2: 'int',
          desc: 'Create a class `Calculator` that supports method chaining. Initialized with `val = initialValue`. Support `add(5)` and `multiply(3)`. Return the final value.',
          s0_in: '10',
          s0_out: '45',
          s0_exp: '(10 + 5) * 3 = 45.',
          s1_in: '0',
          s1_out: '15',
          s1_exp: '(0 + 5) * 3 = 15.',
          fn: (val: number) => (val + 5) * 3
        },
        {
          title: 'Polymorphic Shape Area',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['OOP'],
          t1: 'int size',
          t2: 'int',
          desc: 'Create shapes: `Square` of length `size` and `Circle` of radius `size`. Sum the square of their areas (approximating circle area = 3*r^2). Return the sum.',
          s0_in: '2',
          s0_out: '160',
          s0_exp: 'sqArea = 2*2=4. circArea = 3*4=12. 4^2 + 12^2 = 16 + 144 = 160.',
          s1_in: '1',
          s1_out: '10',
          s1_exp: 'sqArea = 1. circArea = 3. 1^2 + 3^2 = 10.',
          fn: (s: number) => {
            const sqArea = s * s;
            const circArea = 3 * s * s;
            return sqArea * sqArea + circArea * circArea;
          }
        }
      ]
    },
    // WEEK 6: Advanced OOP (Advanced OOP & Operations)
    {
      topic: 'Advanced OOP',
      templates: [
        {
          title: 'Static Counter Incrementor',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Advanced OOP'],
          t1: 'int instances',
          t2: 'int',
          desc: 'Create a class with a static counter that increments each time a new instance is simulated. Return the value after `instances` iterations.',
          s0_in: '5',
          s0_out: '5',
          s0_exp: '5 instances simulated.',
          s1_in: '12',
          s1_out: '12',
          s1_exp: '12 instances simulated.',
          fn: (i: number) => i
        },
        {
          title: 'Dunder String Method',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Advanced OOP'],
          t1: 'int x',
          t2: 'String',
          desc: 'Override the magic `__str__` or `__repr__` method of a class to return "Value: " concatenated with integer `x`.',
          s0_in: '10',
          s0_out: 'Value: 10',
          s0_exp: '"Value: 10" is returned.',
          s1_in: '55',
          s1_out: 'Value: 55',
          s1_exp: '"Value: 55" is returned.',
          fn: (x: number) => `Value: ${x}`
        },
        {
          title: 'Class Method Multiplier',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Advanced OOP'],
          t1: 'int factor',
          t2: 'int',
          desc: 'Create a class method `multiplyByFactor(x)` that multiplies input `x` (default 5) by `factor`. Return the result for x=5.',
          s0_in: '4',
          s0_out: '20',
          s0_exp: '5 * 4 = 20.',
          s1_in: '10',
          s1_out: '50',
          s1_exp: '5 * 10 = 50.',
          fn: (f: number) => 5 * f
        },
        {
          title: 'Custom Exception Trigger',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Advanced OOP'],
          t1: 'int x',
          t2: 'String',
          desc: 'Raise a custom exception `InvalidValueException` if `x < 0`. Return "Valid" if x >= 0, and the exception message "Exception Raised" otherwise.',
          s0_in: '10',
          s0_out: 'Valid',
          s0_exp: '10 is non-negative.',
          s1_in: '-5',
          s1_out: 'Exception Raised',
          s1_exp: '-5 is negative, triggers exception.',
          fn: (x: number) => x >= 0 ? 'Valid' : 'Exception Raised'
        },
        {
          title: 'Iterator Next Element',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Advanced OOP'],
          t1: 'int steps',
          t2: 'int',
          desc: 'Implement a custom iterator that yields consecutive cubes: 1, 8, 27... Return the value at step number `steps` (1-indexed).',
          s0_in: '3',
          s0_out: '27',
          s0_exp: 'Third cube is 3^3 = 27.',
          s1_in: '1',
          s1_out: '1',
          s1_exp: 'First cube is 1^3 = 1.',
          fn: (s: number) => s ** 3
        },
        {
          title: 'Generator Square Yield',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Advanced OOP'],
          t1: 'int limit',
          t2: 'int',
          desc: 'Write a generator function that yields squares of numbers from 1 to `limit`. Return the sum of all yielded numbers.',
          s0_in: '3',
          s0_out: '14',
          s0_exp: '1^2 + 2^2 + 3^2 = 1 + 4 + 9 = 14.',
          s1_in: '2',
          s1_out: '5',
          s1_exp: '1^2 + 2^2 = 1 + 4 = 5.',
          fn: (l: number) => Array.from({ length: l }, (_, i) => (i + 1) ** 2).reduce((a, b) => a + b, 0)
        },
        {
          title: 'Magic Add Overload',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Advanced OOP'],
          t1: 'int value',
          t2: 'int',
          desc: 'Overload the addition operator `__add__` on a custom Box class so adding Box(val) and Box(val*2) returns Box(val + val*2). Return the integer value.',
          s0_in: '10',
          s0_out: '30',
          s0_exp: 'Box(10) + Box(20) yields Box(30).',
          s1_in: '5',
          s1_out: '15',
          s1_exp: 'Box(5) + Box(10) yields Box(15).',
          fn: (v: number) => v + v * 2
        },
        {
          title: 'Property Decorator Getter',
          difficulty: Difficulty.MEDIUM,
          points: 25,
          tags: ['Advanced OOP'],
          t1: 'int tempInC',
          t2: 'int',
          desc: 'Create a property getter and setter. The setter takes `tempInC` and computes Fahrenheit. Return the temperature in Fahrenheit.',
          s0_in: '100',
          s0_out: '212',
          s0_exp: '(100 * 9/5) + 32 = 212.',
          s1_in: '20',
          s1_out: '68',
          s1_exp: '(20 * 9/5) + 32 = 68.',
          fn: (c: number) => Math.round((c * 9 / 5) + 32)
        },
        {
          title: 'Context Manager Simulator',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Advanced OOP'],
          t1: 'int initValue',
          t2: 'int',
          desc: 'Create a context manager class using `__enter__` and `__exit__`. `__enter__` doubles the initial value. If an exception is raised, `__exit__` resets it to 0. Return the value after entry.',
          s0_in: '25',
          s0_out: '50',
          s0_exp: 'Value doubled after enter is 50.',
          s1_in: '12',
          s1_out: '24',
          s1_exp: 'Value doubled after enter is 24.',
          fn: (v: number) => v * 2
        },
        {
          title: 'Decorated Function Call',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Advanced OOP'],
          t1: 'int value',
          t2: 'int',
          desc: 'Write a decorator `@log_call` that adds 10 to the return value of any decorated function. Apply it to a function that returns `value * 2`. Return the result.',
          s0_in: '5',
          s0_out: '20',
          s0_exp: '(5 * 2) + 10 = 20.',
          s1_in: '20',
          s1_out: '50',
          s1_exp: '(20 * 2) + 10 = 50.',
          fn: (v: number) => (v * 2) + 10
        }
      ]
    },
    // WEEK 7: Python Libraries (Standard Python Libraries)
    {
      topic: 'Python Libraries',
      templates: [
        {
          title: 'Math GCD Estimator',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Libraries'],
          t1: 'int x',
          t2: 'int',
          desc: 'Use the `math` library to find the Greatest Common Divisor of `x` and 60.',
          s0_in: '24',
          s0_out: '12',
          s0_exp: 'GCD of 24 and 60 is 12.',
          s1_in: '17',
          s1_out: '1',
          s1_exp: '17 is prime, GCD is 1.',
          fn: (x: number) => {
            let a = x, b = 60;
            while (b !== 0) {
              const temp = b;
              b = a % b;
              a = temp;
            }
            return a;
          }
        },
        {
          title: 'Regex Numeric Extractor',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Libraries'],
          t1: 'int x',
          t2: 'int',
          desc: 'Extract all digits from the string "user_id_`x`" using regex. Parse and return them as an integer.',
          s0_in: '12345',
          s0_out: '12345',
          s0_exp: 'Digits extracted: 12345.',
          s1_in: '99',
          s1_out: '99',
          s1_exp: 'Digits extracted: 99.',
          fn: (x: number) => x
        },
        {
          title: 'Random Uniform Seed',
          difficulty: Difficulty.EASY,
          points: 10,
          tags: ['Libraries'],
          t1: 'int seed',
          t2: 'int',
          desc: 'Simulate seeding a pseudo-random generator with `seed`. Return `(seed * 1103515245 + 12345) % 32768`.',
          s0_in: '123',
          s0_out: '7680',
          s0_exp: '(123 * 1103515245 + 12345) % 32768 = 7680.',
          s1_in: '5',
          s1_out: '29810',
          s1_exp: '(5 * 1103515245 + 12345) % 32768 = 29810.',
          fn: (s: number) => (s * 1103515245 + 12345) % 32768
        },
        {
          title: 'JSON Data Loader',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Libraries'],
          t1: 'int score',
          t2: 'String',
          desc: 'Deserialize a JSON string \'{"score": score}\' and return "Passed" if score >= 50, and "Failed" otherwise.',
          s0_in: '75',
          s0_out: 'Passed',
          s0_exp: '75 >= 50, so passes.',
          s1_in: '20',
          s1_out: 'Failed',
          s1_exp: '20 < 50, so fails.',
          fn: (s: number) => s >= 50 ? 'Passed' : 'Failed'
        },
        {
          title: 'Datetime Day Difference',
          difficulty: Difficulty.EASY,
          points: 15,
          tags: ['Libraries'],
          t1: 'int daysOffset',
          t2: 'int',
          desc: 'Calculate the date offset. Given `daysOffset`, return the absolute difference in days between today and a date `daysOffset` in the future.',
          s0_in: '15',
          s0_out: '15',
          s0_exp: 'Absolute difference is 15 days.',
          s1_in: '-7',
          s1_out: '7',
          s1_exp: 'Absolute difference is 7 days.',
          fn: (d: number) => Math.abs(d)
        },
        {
          title: 'Collections Counter Most Common',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Libraries'],
          t1: 'int value',
          t2: 'int',
          desc: 'Use `collections.Counter` to find the frequency of the digit 7 in the string representation of `value`.',
          s0_in: '17273747',
          s0_out: '4',
          s0_exp: '7 appears 4 times in 17273747.',
          s1_in: '12345',
          s1_out: '0',
          s1_exp: '7 does not appear in 12345.',
          fn: (v: number) => String(v).split('').filter(c => c === '7').length
        },
        {
          title: 'Itertools Permutations Count',
          difficulty: Difficulty.MEDIUM,
          points: 20,
          tags: ['Libraries'],
          t1: 'int n',
          t2: 'int',
          desc: 'Using `itertools.permutations`, find the total number of permutations of a list of size `n` (n <= 7). Formula: n!.',
          s0_in: '4',
          s0_out: '24',
          s0_exp: '4! = 24 combinations.',
          s1_in: '5',
          s1_out: '120',
          s1_exp: '5! = 120 combinations.',
          fn: (n: number) => {
            let fact = 1;
            for (let i = 2; i <= n; i++) fact *= i;
            return fact;
          }
        },
        {
          title: 'Statistics Mean Variance',
          difficulty: Difficulty.MEDIUM,
          points: 25,
          tags: ['Libraries'],
          t1: 'int scale',
          t2: 'int',
          desc: 'Given `scale`, generate array [scale*1, scale*2, scale*3, scale*4]. Calculate the integer average (mean) of the elements.',
          s0_in: '5',
          s0_out: '13',
          s0_exp: 'Array is [5, 10, 15, 20]. Average is (5+10+15+20)/4 = 12.5, rounded to 13.',
          s1_in: '2',
          s1_out: '5',
          s1_exp: 'Array is [2, 4, 6, 8]. Average is (2+4+6+8)/4 = 5.',
          fn: (s: number) => Math.round((s * 1 + s * 2 + s * 3 + s * 4) / 4)
        },
        {
          title: 'Regex Pattern Validator',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Libraries'],
          t1: 'int num',
          t2: 'int',
          desc: 'Use regex to validate a credit card prefix format: must start with 4 and be exactly 5 digits. If valid return 1, else 0. Test with `num` (e.g. 41112 is valid).',
          s0_in: '41112',
          s0_out: '1',
          s0_exp: 'Starts with 4 and is exactly 5 digits.',
          s1_in: '51112',
          s1_out: '0',
          s1_exp: 'Starts with 5, which is invalid.',
          fn: (n: number) => {
            const str = String(n);
            return /^4\d{4}$/.test(str) ? 1 : 0;
          }
        },
        {
          title: 'Math Factorial Log',
          difficulty: Difficulty.HARD,
          points: 30,
          tags: ['Libraries'],
          t1: 'int x',
          t2: 'int',
          desc: 'Use `math.log10(math.factorial(x))` to find the number of digits in the factorial of `x` (x <= 10). Formula: floor(log10(fact)) + 1.',
          s0_in: '5',
          s0_out: '3',
          s0_exp: '5! = 120. log10(120) = 2.079. floor(2.079) + 1 = 3.',
          s1_in: '10',
          s1_out: '7',
          s1_exp: '10! = 3628800. floor(log10(3628800)) + 1 = 7.',
          fn: (x: number) => {
            let fact = 1;
            for (let i = 2; i <= x; i++) fact *= i;
            return Math.floor(Math.log10(fact)) + 1;
          }
        }
      ]
    }
  ];

  function getDynamicTemplate(tmplIdx: number, wIdx: number) {
    return weekData[wIdx].templates[tmplIdx];
  }

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
      const tmpl = getDynamicTemplate(pIdx, wIdx);
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

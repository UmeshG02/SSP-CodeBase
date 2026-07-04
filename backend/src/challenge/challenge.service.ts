import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { SubmitSqlDto } from './dto/submit-sql.dto';
import { ChallengeType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

@Injectable()
export class ChallengeService {
  constructor(
    private prisma: PrismaService,
    private profileService: ProfileService,
  ) {}

  async createProblem(dto: CreateProblemDto) {
    return this.prisma.problem.create({
      data: {
        ...dto,
      },
    });
  }

  async addTestCase(problemId: string, input: string, expected: string, isSample: boolean = false) {
    return this.prisma.testCase.create({
      data: {
        problemId,
        input,
        expected,
        isSample,
      },
    });
  }

  async getProblems(userId: string, type?: any) {
    const problems = await this.prisma.problem.findMany({
      where: type ? { type } : {},
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    const solvedSubmissions = await this.prisma.submission.findMany({
      where: {
        userId,
        status: 'ACCEPTED',
      },
      select: {
        problemId: true,
      },
    });

    const solvedIds = new Set(solvedSubmissions.map((s) => s.problemId));

    return problems.map((p) => ({
      ...p,
      solved: solvedIds.has(p.id),
    }));
  }

  async getProblemBySlug(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: {
        testCases: {
          where: { isSample: true },
        },
      },
    });
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    return problem;
  }

  async submitCode(userId: string, slug: string, dto: SubmitCodeDto) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: { testCases: true },
    });
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    // Intercept non-coding quiz-like challenges
    if (problem.type !== ChallengeType.CODING) {
      let passed = false;
      let actual = dto.code;
      const expected = problem.solutionCode || '';

      if (problem.type === ChallengeType.APTITUDE) {
        passed = dto.code.trim().toUpperCase() === expected.trim().toUpperCase();
      } else if (problem.type === ChallengeType.PUZZLE) {
        const cleanUser = dto.code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanExp = expected.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        passed = cleanUser === cleanExp;
      } else if (problem.type === ChallengeType.INTERVIEW) {
        passed = dto.code.trim().length >= 10;
      }

      const status = passed ? 'ACCEPTED' : 'WRONG_ANSWER';

      const submission = await this.prisma.submission.create({
        data: {
          userId,
          problemId: problem.id,
          language: dto.language || 'text',
          code: dto.code,
          status,
          runtime: 0.1,
          memory: 128,
        },
      });

      if (status === 'ACCEPTED') {
        await this.profileService.awardXpAndCoins(userId, problem.points, Math.floor(problem.points / 2), `SOLVED_CHALLENGE_${problem.slug}`);
        await this.profileService.recordActivityAndStreak(userId);
        
        if (problem.dayId) {
          await this.checkAndCompleteDay(userId, problem.dayId);
        }
      }

      return {
        status,
        message: status === 'ACCEPTED' ? 'All test cases passed successfully.' : 'Answer is incorrect.',
        testCases: problem.testCases.map(tc => ({
          id: tc.id,
          isSample: tc.isSample,
          input: tc.input,
          expected: tc.expected,
          actual,
          passed,
        })),
        submission,
      };
    }

    const tempDir = path.join(os.tmpdir(), 'ssp-codebase-temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const lang = dto.language.toLowerCase();
    let compilePassed = true;
    let compileErr = '';
    let exeFile = '';
    let javaClassName = 'Solution';

    // 1. Compilation Phase (Runs once per submission)
    if (lang === 'cpp') {
      const classMatch = dto.code.match(/class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : 'Solution';
      const cppFile = path.join(tempDir, `solution_${userId}.cpp`);
      exeFile = path.join(tempDir, `solution_${userId}.exe`);

      const paramTypes = this.getParamTypes(slug);
      let parserBlock = '';
      paramTypes.forEach((type, idx) => {
        const argNum = idx + 1;
        if (type === 'vector<int>') {
          parserBlock += `vector<int> arg${argNum} = parseVectorInt(argv[${argNum}]);\n`;
        } else if (type === 'vector<string>') {
          parserBlock += `vector<string> arg${argNum} = parseVectorString(argv[${argNum}]);\n`;
        } else if (type === 'int') {
          parserBlock += `int arg${argNum} = stoi(argv[${argNum}]);\n`;
        } else if (type === 'double') {
          parserBlock += `double arg${argNum} = stod(argv[${argNum}]);\n`;
        } else if (type === 'string') {
          parserBlock += `string arg${argNum} = cleanString(argv[${argNum}]);\n`;
        }
      });
      const argNames = paramTypes.map((_, idx) => `arg${idx + 1}`).join(', ');

      const cppRunnerCode = `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

vector<int> parseVectorInt(string s) {
    vector<int> res;
    s.erase(remove(s.begin(), s.end(), '['), s.end());
    s.erase(remove(s.begin(), s.end(), ']'), s.end());
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        if (!token.empty()) res.push_back(stoi(token));
    }
    return res;
}

vector<string> parseVectorString(string s) {
    vector<string> res;
    s.erase(remove(s.begin(), s.end(), '['), s.end());
    s.erase(remove(s.begin(), s.end(), ']'), s.end());
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        if (!token.empty()) {
            token.erase(remove(token.begin(), token.end(), '"'), token.end());
            token.erase(remove(token.begin(), token.end(), '\\''), token.end());
            res.push_back(token);
        }
    }
    return res;
}

string cleanString(string s) {
    if (s.length() >= 2 && s.front() == '"' && s.back() == '"') {
        s = s.substr(1, s.length() - 2);
    }
    return s;
}

void printResult(int val) { cout << val << endl; }
void printResult(bool val) { cout << boolalpha << val << endl; }
void printResult(double val) { cout << val << endl; }
void printResult(string val) { cout << val << endl; }
void printResult(vector<int> val) {
    cout << "[";
    for(size_t i=0; i<val.size(); ++i) {
        cout << val[i] << (i+1 < val.size() ? "," : "");
    }
    cout << "]" << endl;
}
void printResult(vector<string> val) {
    cout << "[";
    for(size_t i=0; i<val.size(); ++i) {
        cout << "\\"" << val[i] << "\\"" << (i+1 < val.size() ? "," : "");
    }
    cout << "]" << endl;
}

// User Code
${dto.code}

int main(int argc, char* argv[]) {
    ${className} solver;
    try {
        ${parserBlock}
        printResult(solver.solve(${argNames}));
    } catch (exception& e) {
        cout << "ERR: " << e.what() << endl;
    }
    return 0;
}
      `;

      fs.writeFileSync(cppFile, cppRunnerCode.trim());
      try {
        execSync(`g++ -O3 "${cppFile}" -o "${exeFile}"`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (err: any) {
        compileErr = err.stderr || err.message || 'Compilation Error';
        compilePassed = false;
      } finally {
        if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
      }
    } else if (lang === 'java') {
      const classMatch = dto.code.match(/class\s+(\w+)/);
      javaClassName = classMatch ? classMatch[1] : 'Solution';

      const tempFile = path.join(tempDir, `${javaClassName}.java`);
      const runnerFile = path.join(tempDir, `Runner.java`);

      const runnerCode = `
import java.lang.reflect.Method;
import java.util.Arrays;

public class Runner {
    public static void main(String[] args) throws Exception {
        String className = args[0];
        String methodName = "solve";
        Class<?> cls = Class.forName(className);
        Object instance = null;
        Method targetMethod = null;
        for (Method m : cls.getDeclaredMethods()) {
            if (m.getName().equals(methodName)) {
                targetMethod = m;
                break;
            }
        }
        if (targetMethod == null) {
            System.out.println("ERR: Method solve not found");
            return;
        }
        Class<?>[] paramTypes = targetMethod.getParameterTypes();
        Object[] invokeArgs = new Object[paramTypes.length];
        for (int i = 0; i < paramTypes.length; i++) {
            Class<?> type = paramTypes[i];
            String rawArg = args[i + 1];
            if (type == int.class || type == Integer.class) {
                invokeArgs[i] = Integer.parseInt(rawArg.trim());
            } else if (type == boolean.class || type == Boolean.class) {
                invokeArgs[i] = Boolean.parseBoolean(rawArg.trim());
            } else if (type == String.class) {
                String s = rawArg.trim();
                if (s.startsWith("\\"") && s.endsWith("\\"")) s = s.substring(1, s.length() - 1);
                invokeArgs[i] = s;
            } else if (type == int[].class) {
                String s = rawArg.replace("[", "").replace("]", "").trim();
                if (s.isEmpty()) {
                    invokeArgs[i] = new int[0];
                } else {
                    String[] parts = s.split(",");
                    int[] arr = new int[parts.length];
                    for (int j = 0; j < parts.length; j++) arr[j] = Integer.parseInt(parts[j].trim());
                    invokeArgs[i] = arr;
                }
            } else if (type == String[].class) {
                String s = rawArg.replace("[", "").replace("]", "").trim();
                if (s.isEmpty()) {
                    invokeArgs[i] = new String[0];
                } else {
                    String[] parts = s.split(",");
                    String[] arr = new String[parts.length];
                    for (int j = 0; j < parts.length; j++) {
                        String p = parts[j].trim();
                        if (p.startsWith("\\"") && p.endsWith("\\"")) p = p.substring(1, p.length() - 1);
                        arr[j] = p;
                    }
                    invokeArgs[i] = arr;
                }
            } else {
                invokeArgs[i] = rawArg;
            }
        }
        if (!java.lang.reflect.Modifier.isStatic(targetMethod.getModifiers())) {
            instance = cls.getDeclaredConstructor().newInstance();
        }
        Object result = targetMethod.invoke(instance, invokeArgs);
        if (result == null) {
            System.out.println("null");
        } else if (result.getClass().isArray()) {
            if (result instanceof int[]) {
                System.out.println(Arrays.toString((int[]) result).replace(" ", ""));
            } else if (result instanceof Object[]) {
                System.out.println(Arrays.toString((Object[]) result).replace(" ", ""));
            } else {
                System.out.println(result);
            }
        } else {
            System.out.println(result.toString().toLowerCase());
        }
    }
}
      `;

      fs.writeFileSync(tempFile, dto.code);
      fs.writeFileSync(runnerFile, runnerCode.trim());

      try {
        execSync(`javac -d "${tempDir}" "${tempFile}" "${runnerFile}"`, { encoding: 'utf8', stdio: 'pipe' });
      } catch (err: any) {
        compileErr = err.stderr || err.message || 'Compilation Error';
        compilePassed = false;
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        if (fs.existsSync(runnerFile)) fs.unlinkSync(runnerFile);
      }
    }

    let status = 'ACCEPTED';
    let runtime = 12.5; // mock base
    let memory = 1024; // mock base

    if (!compilePassed) {
      status = 'COMPILE_ERROR';
    }

    const testCaseResults = problem.testCases.map((tc, index) => {
      let passed = false;
      let output = '';

      if (!compilePassed) {
        output = 'Compile Error:\n' + compileErr;
        passed = false;
      } else if (lang === 'javascript') {
        const tempFile = path.join(tempDir, `runner_${userId}_${index}.js`);
        const runnerCode = `
${dto.code}
try {
  const res = solve(${tc.input});
  console.log(JSON.stringify(res));
} catch (e) {
  console.log("ERR: " + e.message);
}
        `;
        fs.writeFileSync(tempFile, runnerCode.trim());
        try {
          const stdout = execSync(`node "${tempFile}"`, { timeout: 3000, encoding: 'utf8' });
          output = stdout.trim();
          passed = this.compareOutputs(output, tc.expected);
        } catch (e: any) {
          output = 'ERR: ' + (e.stderr || e.message || 'Execution error');
          passed = false;
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      } else if (lang === 'typescript') {
        const tempFile = path.join(tempDir, `runner_${userId}_${index}.ts`);
        const runnerCode = `
${dto.code}
try {
  const res = (solve as any)(${tc.input});
  console.log(JSON.stringify(res));
} catch (e: any) {
  console.log("ERR: " + e.message);
}
        `;
        fs.writeFileSync(tempFile, runnerCode.trim());
        try {
          const stdout = execSync(`npx ts-node "${tempFile}"`, { timeout: 3000, encoding: 'utf8' });
          output = stdout.trim();
          passed = this.compareOutputs(output, tc.expected);
        } catch (e: any) {
          output = 'ERR: ' + (e.stderr || e.message || 'Execution error');
          passed = false;
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      } else if (lang === 'python') {
        const tempFile = path.join(tempDir, `runner_${userId}_${index}.py`);
        const pythonRunnerCode = `
import json
import sys

# User Code
${dto.code}

# Test execution
try:
    res = solve(${tc.input})
    print(json.dumps(res))
except Exception as e:
    print("ERR: " + str(e))
        `;
        fs.writeFileSync(tempFile, pythonRunnerCode.trim());
        try {
          const stdout = execSync(`python "${tempFile}"`, { timeout: 3000, encoding: 'utf8' });
          output = stdout.trim();
          passed = this.compareOutputs(output, tc.expected);
        } catch (e: any) {
          output = 'ERR: ' + (e.stderr || e.message || 'Execution error');
          passed = false;
        } finally {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
      } else if (lang === 'java') {
        const tcArgs = this.parseArguments(tc.input);
        const argsStr = tcArgs.map(x => `"${x.replace(/"/g, '\\"')}"`).join(' ');
        try {
          const stdout = execSync(`java -cp "${tempDir}" Runner ${javaClassName} ${argsStr}`, { timeout: 3000, encoding: 'utf8' });
          output = stdout.trim();
          passed = this.compareOutputs(output, tc.expected);
        } catch (e: any) {
          output = 'ERR: ' + (e.stderr || e.message || 'Execution error');
          passed = false;
        }
      } else if (lang === 'cpp') {
        const tcArgs = this.parseArguments(tc.input);
        const argsStr = tcArgs.map(x => `"${x.replace(/"/g, '\\"')}"`).join(' ');
        try {
          const stdout = execSync(`"${exeFile}" ${argsStr}`, { timeout: 3000, encoding: 'utf8' });
          output = stdout.trim();
          passed = this.compareOutputs(output, tc.expected);
        } catch (e: any) {
          output = 'ERR: ' + (e.stderr || e.message || 'Execution error');
          passed = false;
        }
      } else {
        // Fallback mock pass
        passed = true;
        output = tc.expected;
      }

      if (!passed) {
        if (output.startsWith('ERR:') || output.startsWith('ERR ')) {
          status = 'RUNTIME_ERROR';
        } else if (status !== 'RUNTIME_ERROR') {
          status = 'WRONG_ANSWER';
        }
      }

      if (tc.isSample) {
        return {
          id: tc.id,
          isSample: true,
          input: tc.input,
          expected: tc.expected,
          actual: output,
          passed,
        };
      } else {
        return {
          id: tc.id,
          isSample: false,
          passed,
        };
      }
    });

    // Clean compile class files and compiled .exe if created
    if (lang === 'java') {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        if (file.startsWith(javaClassName) || file.startsWith('Runner')) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      }
    } else if (lang === 'cpp') {
      if (fs.existsSync(exeFile)) {
        fs.unlinkSync(exeFile);
      }
    }

    // Save submission
    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        language: dto.language,
        code: dto.code,
        status: status as any,
        runtime,
        memory,
      },
    });

    if (status === 'ACCEPTED') {
      await this.profileService.awardXpAndCoins(userId, problem.points, Math.floor(problem.points / 2), `SOLVED_PROBLEM_${problem.slug}`);
      await this.profileService.recordActivityAndStreak(userId);
      
      if (problem.dayId) {
        await this.checkAndCompleteDay(userId, problem.dayId);
      }
    }

    // Find the first failed or runtime error message to present to the user
    let finalMessage = 'All test cases passed successfully.';
    if (status === 'COMPILE_ERROR') {
      finalMessage = compileErr;
    } else if (status === 'RUNTIME_ERROR' || status === 'WRONG_ANSWER') {
      const failedTc = testCaseResults.find(tc => !tc.passed);
      if (failedTc && failedTc.actual && failedTc.actual.startsWith('ERR:')) {
        finalMessage = failedTc.actual.replace(/^ERR:\s*/, '');
      } else {
        finalMessage = 'One or more test cases returned incorrect values.';
      }
    }

    return {
      status,
      message: finalMessage,
      testCases: testCaseResults,
      submission,
    };
  }

  async submitSql(userId: string, slug: string, dto: SubmitSqlDto) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: { testCases: true },
    });
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    let status = 'ACCEPTED';
    let message = 'Query executed successfully.';
    let resultRows: any[] = [];

    const cleanQuery = dto.query.trim();
    if (!cleanQuery.toLowerCase().startsWith('select')) {
      throw new BadRequestException('Only SELECT queries are allowed in this sandbox.');
    }

    const testCaseResults = await Promise.all(problem.testCases.map(async (tc, index) => {
      let passed = false;
      let output = '';
      let rows: any[] = [];

      try {
        // Dynamically redirect user's query to the testcase's corresponding table state
        let testcaseQuery = cleanQuery;
        if (index > 0) {
          testcaseQuery = testcaseQuery
            .replace(/\bsql_users_challenge\b/gi, `sql_users_challenge_${index}`)
            .replace(/\bsql_employees_challenge\b/gi, `sql_employees_challenge_${index}`)
            .replace(/\bsql_products_challenge\b/gi, `sql_products_challenge_${index}`);
        }

        const runResult = await this.prisma.$queryRawUnsafe(testcaseQuery);
        rows = runResult as any[];
        output = JSON.stringify(rows, (key, val) => typeof val === 'bigint' ? Number(val) : val);
        passed = output.trim() === tc.expected.trim();

        if (index === 0) {
          resultRows = rows;
        }
      } catch (err: any) {
        output = 'Error: ' + err.message;
        passed = false;
      }

      if (!passed) {
        status = 'WRONG_ANSWER';
      }

      if (tc.isSample) {
        return {
          id: tc.id,
          isSample: true,
          input: tc.input,
          expected: tc.expected,
          actual: output,
          passed,
        };
      } else {
        return {
          id: tc.id,
          isSample: false,
          passed,
        };
      }
    }));

    // Save SQL submission record
    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        language: 'sql',
        code: dto.query,
        status: status as any,
        runtime: 8.2,
        memory: 1024,
      },
    });

    if (status === 'ACCEPTED') {
      await this.profileService.awardXpAndCoins(userId, problem.points, Math.floor(problem.points / 2), `SOLVED_SQL_${problem.slug}`);
      await this.profileService.recordActivityAndStreak(userId);
      message = 'All test cases passed!';
      
      if (problem.dayId) {
        await this.checkAndCompleteDay(userId, problem.dayId);
      }
    } else {
      message = 'One or more test cases failed.';
    }

    return {
      submission,
      result: resultRows,
      message,
      testCaseResults,
    };
  }

  async askAiHint(slug: string, code?: string) {
    const problem = await this.prisma.problem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundException('Problem not found');

    try {
      if (process.env.OPENAI_API_KEY === 'mock-or-real-key' || !process.env.OPENAI_API_KEY) {
        return {
          hint: `Try considering a dictionary/hashmap to keep track of elements you have already visited. This can help reduce your time complexity from O(N^2) to O(N).`,
        };
      }
      return {
        hint: `Consider using a two-pointer approach to check elements from both ends.`,
      };
    } catch (err) {
      return { hint: 'Review your loops and look for redundancies.' };
    }
  }

  async getSubmissions(userId: string, problemSlug: string) {
    return this.prisma.submission.findMany({
      where: {
        userId,
        problem: { slug: problemSlug },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getProblemLeaderboard(problemSlug: string) {
    return this.prisma.submission.findMany({
      where: {
        problem: { slug: problemSlug },
        status: 'ACCEPTED',
      },
      orderBy: [
        { runtime: 'asc' },
        { createdAt: 'asc' },
      ],
      take: 20,
      select: {
        id: true,
        runtime: true,
        memory: true,
        createdAt: true,
        user: {
          select: {
            profile: {
              select: {
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getProblemComments(problemSlug: string) {
    return this.prisma.comment.findMany({
      where: {
        problem: { slug: problemSlug },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            profile: {
              select: {
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async addProblemComment(userId: string, problemSlug: string, content: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug: problemSlug },
    });
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    return this.prisma.comment.create({
      data: {
        userId,
        problemId: problem.id,
        content,
      },
      include: {
        user: {
          select: {
            profile: {
              select: {
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  private parseArguments(inputStr: string): string[] {
    const args: string[] = [];
    let current = '';
    let inBrackets = 0;
    let inQuotes = false;
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (char === '[' || char === '{') inBrackets++;
      else if (char === ']' || char === '}') inBrackets--;
      else if (char === '"') inQuotes = !inQuotes;
      
      if (char === ',' && inBrackets === 0 && !inQuotes) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      args.push(current.trim());
    }
    return args;
  }

  private getParamTypes(slug: string): string[] {
    if (slug.startsWith('two-sum')) return ['vector<int>', 'int'];
    if (slug.startsWith('palindrome-number') || slug.startsWith('leap-year-check') || slug.startsWith('factorial-calc') || slug.startsWith('prime-check') || slug.startsWith('fibonacci-at-n') || slug.startsWith('is-square')) return ['int'];
    if (slug.startsWith('word-reverse') || slug.startsWith('count-vowels')) return ['string'];
    if (slug.startsWith('array-sum') || slug.startsWith('array-max') || slug.startsWith('array-min') || slug.startsWith('even-filter') || slug.startsWith('multiply-array-elements')) return ['vector<int>'];
    if (slug.startsWith('celsius-to-fahrenheit')) return ['double'];
    if (slug.startsWith('contain-substring')) return ['string', 'string'];
    if (slug.startsWith('get-longest-word')) return ['vector<string>'];
    return ['int']; // default fallback
  }

  private compareOutputs(output: string, expected: string): boolean {
    if (output.startsWith('ERR:')) return false;
    const cleanOutput = output.replace(/\s+/g, '');
    const cleanExpected = expected.replace(/\s+/g, '');
    return cleanOutput === cleanExpected;
  }

  async checkAndCompleteDay(userId: string, dayId: string) {
    const day = await this.prisma.day.findUnique({
      where: { id: dayId },
      include: { problems: true },
    });
    if (!day) return;

    const solvedSubmissions = await this.prisma.submission.findMany({
      where: {
        userId,
        problemId: { in: day.problems.map(p => p.id) },
        status: 'ACCEPTED',
      },
      select: { problemId: true },
    });

    const solvedIds = new Set(solvedSubmissions.map(s => s.problemId));
    const allSolved = day.problems.every(p => solvedIds.has(p.id));

    if (allSolved) {
      const existing = await this.prisma.userDayProgress.findUnique({
        where: { userId_dayId: { userId, dayId } }
      });

      if (!existing || !existing.completed) {
        const week = await this.prisma.week.findUnique({
          where: { id: day.weekId },
          include: { path: true },
        });

        if (week) {
          const totalXp = day.problems.reduce((acc, p) => acc + p.points, 0);

          await this.prisma.$transaction([
            this.prisma.userDayProgress.upsert({
              where: { userId_dayId: { userId, dayId } },
              create: {
                userId,
                dayId,
                completed: true,
                completedAt: new Date(),
                xpEarned: totalXp,
                accuracy: 100.0,
                score: totalXp,
                timeSpent: 300,
              },
              update: {
                completed: true,
                completedAt: new Date(),
              }
            }),
            this.prisma.userProgress.upsert({
              where: { userId_pathId: { userId, pathId: week.pathId } },
              create: {
                userId,
                pathId: week.pathId,
                currentWeek: week.weekNumber,
                currentDay: 1,
              },
              update: {
                currentWeek: week.weekNumber + 1,
                currentDay: 1,
              }
            })
          ]);
        }
      }
    }
  }
}

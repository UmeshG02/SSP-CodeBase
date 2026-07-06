import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeType, Difficulty } from '@prisma/client';
import pdf = require('pdf-parse');

@Injectable()
export class RoadmapService {
  constructor(private prisma: PrismaService) {}

  async getPaths() {
    return this.prisma.learningPath.findMany({
      orderBy: { title: 'asc' },
    });
  }

  async getPathDetails(userId: string, slug: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { slug },
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!path) {
      throw new NotFoundException('Learning path not found');
    }

    // Get or initialize user progress on this path
    let userProgress = await this.prisma.userProgress.findUnique({
      where: { userId_pathId: { userId, pathId: path.id } },
    });

    if (!userProgress) {
      userProgress = await this.prisma.userProgress.create({
        data: {
          userId,
          pathId: path.id,
          currentWeek: 1,
          currentDay: 1,
        },
      });
    }

    // Get all completed days for this user
    const dayProgressList = await this.prisma.userDayProgress.findMany({
      where: { userId },
    });

    const completedDayIds = new Set(
      dayProgressList.filter(dp => dp.completed).map(dp => dp.dayId)
    );
    const progressMap = new Map(dayProgressList.map(dp => [dp.dayId, dp]));

    // Evaluate locked states sequentially
    let previousDayCompleted = true; // Day 1 Week 1 is always unlocked

    const weeksWithLocks = path.weeks.map(week => {
      const daysWithLocks = week.days.map(day => {
        const completed = completedDayIds.has(day.id);
        
        // Day is unlocked if:
        // - It's Week 1 Day 1 (previousDayCompleted starts as true)
        // - OR the user has solved the previous day
        // - OR the user's progress record explicitly places them at or past this day
        const isModuleExplicitlyUnlocked = userProgress.unlockedWeeks && userProgress.unlockedWeeks.includes(week.weekNumber);

        const unlocked = previousDayCompleted || 
          isModuleExplicitlyUnlocked ||
          (week.weekNumber < userProgress.currentWeek) ||
          (week.weekNumber === userProgress.currentWeek && day.dayNumber <= userProgress.currentDay);

        // Update previousDayCompleted for the NEXT day check
        previousDayCompleted = completed;

        const metrics = progressMap.get(day.id);

        return {
          id: day.id,
          title: day.title,
          dayNumber: day.dayNumber,
          objectives: day.objectives,
          completed,
          unlocked,
          metrics: metrics ? {
            xpEarned: metrics.xpEarned,
            timeSpent: metrics.timeSpent,
            accuracy: metrics.accuracy,
            score: metrics.score,
            completedAt: metrics.completedAt,
          } : null,
        };
      });

      return {
        id: week.id,
        title: week.title,
        weekNumber: week.weekNumber,
        days: daysWithLocks,
      };
    });

    return {
      path: {
        id: path.id,
        title: path.title,
        description: path.description,
        slug: path.slug,
      },
      userProgress: {
        currentWeek: userProgress.currentWeek,
        currentDay: userProgress.currentDay,
      },
      weeks: weeksWithLocks,
    };
  }

  async getDayDetails(userId: string, dayId: string) {
    const day = await this.prisma.day.findUnique({
      where: { id: dayId },
      include: {
        week: {
          include: { path: true },
        },
        problems: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!day) {
      throw new NotFoundException('Day not found');
    }

    // Verify day is unlocked for the user
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId_pathId: { userId, pathId: day.week.pathId } },
    });

    const isFirstDay = day.week.weekNumber === 1 && day.dayNumber === 1;
    let isUnlocked = isFirstDay;

    if (userProgress) {
      const isModuleExplicitlyUnlocked = userProgress.unlockedWeeks && userProgress.unlockedWeeks.includes(day.week.weekNumber);
      isUnlocked = isFirstDay || 
        isModuleExplicitlyUnlocked ||
        (day.week.weekNumber < userProgress.currentWeek) ||
        (day.week.weekNumber === userProgress.currentWeek && day.dayNumber <= userProgress.currentDay);
    }

    if (!isUnlocked) {
      // Check if previous day is completed
      let prevDayNumber = day.dayNumber - 1;
      let prevWeekNumber = day.week.weekNumber;
      if (prevDayNumber === 0) {
        prevDayNumber = 7;
        prevWeekNumber -= 1;
      }

      if (prevWeekNumber > 0) {
        const prevDay = await this.prisma.day.findFirst({
          where: {
            dayNumber: prevDayNumber,
            week: {
              weekNumber: prevWeekNumber,
              pathId: day.week.pathId,
            },
          },
        });

        if (prevDay) {
          const prevProgress = await this.prisma.userDayProgress.findUnique({
            where: { userId_dayId: { userId, dayId: prevDay.id } },
          });
          if (prevProgress && prevProgress.completed) {
            isUnlocked = true;
          }
        }
      }
    }

    if (!isUnlocked) {
      throw new BadRequestException('This learning day is currently locked. Complete previous days to unlock.');
    }

    // Fetch user's ACCEPTED submissions for these problems
    const submissions = await this.prisma.submission.findMany({
      where: {
        userId,
        problemId: { in: day.problems.map(p => p.id) },
        status: 'ACCEPTED',
      },
      select: { problemId: true },
    });

    const solvedProblemIds = new Set(submissions.map(s => s.problemId));

    const problemsWithSolved = day.problems.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      type: p.type,
      points: p.points,
      tags: p.tags,
      solved: solvedProblemIds.has(p.id),
      templateCode: p.templateCode,
    }));

    return {
      day: {
        id: day.id,
        title: day.title,
        dayNumber: day.dayNumber,
        objectives: day.objectives,
        weekId: day.weekId,
        weekNumber: day.week.weekNumber,
        pathSlug: day.week.path.slug,
      },
      problems: problemsWithSolved,
    };
  }

  async parsePdfAndGenerateRoadmap(fileBuffer: Buffer) {
    let pdfText = '';
    try {
      const parser = new pdf.PDFParse({ data: fileBuffer });
      const textResult = await parser.getText();
      pdfText = textResult.text;
    } catch (err: any) {
      throw new BadRequestException('Failed to extract text from PDF: ' + err.message);
    }

    // Scan for headings matching "X. <Heading Name>"
    const lines = pdfText.split('\n');
    const headings: string[] = [];
    for (const line of lines) {
      const clean = line.trim();
      if (/^\d+\.\s+[A-Za-z]/.test(clean)) {
        // Strip the trailing page indicators or duplicates
        const heading = clean.replace(/^\d+\.\s+/, '').trim();
        if (heading.length > 3 && !headings.includes(heading)) {
          headings.push(heading);
        }
      }
    }

    if (headings.length === 0) {
      throw new BadRequestException('No standard numbered syllabus topics found in the uploaded PDF.');
    }

    const pathTitle = `Roadmap from Syllabus (${new Date().toLocaleDateString()})`;
    const pathSlug = `syllabus-path-${Date.now()}`;

    // Create LearningPath
    const path = await this.prisma.learningPath.create({
      data: {
        title: pathTitle,
        slug: pathSlug,
        description: `Custom roadmap generated from uploaded PDF document containing ${headings.length} core headings.`,
      },
    });

    // Group headings into Weeks and Days (Up to 7 Weeks, 7 Days each)
    const totalDays = Math.min(headings.length, 49);
    const totalWeeks = Math.ceil(totalDays / 7);

    for (let w = 0; w < totalWeeks; w++) {
      const week = await this.prisma.week.create({
        data: {
          pathId: path.id,
          title: `Week ${w + 1}: ${headings[w * 7] || 'Advanced Concepts'}`,
          weekNumber: w + 1,
        },
      });

      for (let d = 0; d < 7; d++) {
        const dayIdx = w * 7 + d;
        if (dayIdx >= totalDays) break;

        const dayTopic = headings[dayIdx];
        const day = await this.prisma.day.create({
          data: {
            weekId: week.id,
            title: `Day ${d + 1} - ${dayTopic}`,
            dayNumber: d + 1,
            objectives: [
              `Analyze and master ${dayTopic}`,
              `Demonstrate proficiency through coding and auxiliary quizzes`
            ],
          },
        });

        // Seed 1 standard Coding problem for custom path to make it lighter
        const codingProblem = await this.prisma.problem.create({
          data: {
            title: `${dayTopic} Basic Challenge`,
            slug: `custom-coding-w${w+1}-d${d+1}`,
            description: `# ${dayTopic} Challenge\n\nWrite a function \`solve(x)\` that returns \`x * 10\`.`,
            difficulty: Difficulty.EASY,
            type: ChallengeType.CODING,
            points: 10,
            tags: ['Custom'],
            dayId: day.id,
            inputFormat: 'Integer input',
            outputFormat: 'Integer output',
            templateCode: JSON.stringify({
              python: 'def solve(x):\n    return x * 10',
              javascript: 'function solve(x) {\n  return x * 10;\n}'
            }),
          },
        });

        await this.prisma.testCase.create({
          data: {
            problemId: codingProblem.id,
            input: '5',
            expected: '50',
            isSample: true,
          },
        });
      }
    }

    return path;
  }

  async unlockWeekWithKey(userId: string, key: string) {
    if (!key || typeof key !== 'string') {
      throw new BadRequestException('Access key is required.');
    }

    const cleanKey = key.trim();

    const week = await this.prisma.week.findFirst({
      where: { accessKey: cleanKey },
      include: { path: true }
    });

    if (!week) {
      throw new NotFoundException('Invalid Module access key.');
    }

    let userProgress = await this.prisma.userProgress.findUnique({
      where: { userId_pathId: { userId, pathId: week.pathId } }
    });

    if (!userProgress) {
      userProgress = await this.prisma.userProgress.create({
        data: {
          userId,
          pathId: week.pathId,
          currentWeek: 1,
          currentDay: 1,
          unlockedWeeks: []
        }
      });
    }

    if (!userProgress.unlockedWeeks.includes(week.weekNumber)) {
      const updatedUnlocked = [...userProgress.unlockedWeeks, week.weekNumber];
      await this.prisma.userProgress.update({
        where: { id: userProgress.id },
        data: { unlockedWeeks: updatedUnlocked }
      });
    }

    return {
      success: true,
      title: week.title,
      weekNumber: week.weekNumber
    };
  }
}

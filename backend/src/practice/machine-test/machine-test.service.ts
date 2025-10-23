import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateTestDto } from './dto/generate-test.dto';

@Injectable()
export class MachineTestService {
  private readonly logger = new Logger(MachineTestService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Shuffles an array in-place using the Fisher-Yates algorithm.
   * @param array The array to be shuffled.
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generates a new machine test for a user.
   * @param userId - The ID of the user for whom the test is generated.
   * @param generateTestDto - DTO containing difficulty and question count.
   * @returns The newly created machine test with its associated problems.
   * @throws {NotFoundException} If not enough questions are available.
   */
  async generateTest(userId: string, generateTestDto: GenerateTestDto) {
    const { difficulty, count } = generateTestDto;
    this.logger.log(
      `Generating test for user ${userId} with difficulty: ${difficulty}, count: ${count}`,
    );

    const allMatchingProblems = await this.prisma.machineTestProblem.findMany({
      where: { difficulty, isPublic: true },
      select: { id: true },
    });

    if (allMatchingProblems.length < count) {
      throw new NotFoundException(
        `Not enough questions of difficulty '${difficulty}' available. Found ${allMatchingProblems.length}, need ${count}.`,
      );
    }

    const problemIds = allMatchingProblems.map((p) => p.id);
    const selectedIds = this.shuffleArray(problemIds).slice(0, count);

    const machineTest = await this.prisma.machineTest.create({
      data: {
        userId,
        difficulty,
        problems: {
          create: selectedIds.map((problemId) => ({
            problemId,
          })),
        },
      },
      include: {
        problems: {
          include: {
            problem: true,
          },
        },
      },
    });

    this.logger.log(
      `Successfully created machine test with ID: ${machineTest.id}`,
    );
    return machineTest;
  }

  /**
   * Finds a specific machine test owned by a given user.
   * @param testId - The ID of the test to find.
   * @param userId - The ID of the user who owns the test.
   * @returns The machine test with its problems.
   * @throws {NotFoundException} If the test is not found for the user.
   */
  async findOne(testId: number, userId: string) {
    const machineTest = await this.prisma.machineTest.findFirst({
      where: {
        id: testId,
        userId: userId,
      },
      include: {
        problems: {
          orderBy: { problemId: 'asc' },
          include: {
            problem: true,
          },
        },
      },
    });

    if (!machineTest) {
      throw new NotFoundException(
        `Machine test with ID ${testId} not found for this user.`,
      );
    }

    return machineTest;
  }
}

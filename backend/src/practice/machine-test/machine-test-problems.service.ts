import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, QuestionDifficulty } from '@prisma/client';

/**
 * Defines the options for querying machine test problems.
 */
interface FindAllOptions {
  difficulty?: QuestionDifficulty;
  count?: number;
}

/**
 * A helper type for the transformed problem, making the tags a simple string array.
 */
type TransformedProblem = Prisma.MachineTestProblemGetPayload<{
  include: { tags: { select: { tag: { select: { name: true } } } } };
}> & { tags: string[] };

@Injectable()
export class MachineTestProblemsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Transforms the raw problem data from Prisma to a cleaner format.
   * Specifically, it flattens the tags from `[{ tag: { name: '...' } }]` to `['...']`.
   * @param problem - The problem object from Prisma.
   * @returns A problem object with a simplified `tags` array.
   */
  private transformProblem(problem: any): TransformedProblem {
    return {
      ...problem,
      tags: problem.tags.map((t: { tag: { name: string } }) => t.tag.name),
    };
  }

  /**
   * Finds all public machine test problems, with optional filtering and pagination.
   * @param options - Filtering options for difficulty and count.
   * @returns A promise that resolves to an array of transformed problems.
   */
  async findAll(options: FindAllOptions = {}): Promise<TransformedProblem[]> {
    const { difficulty, count } = options;
    const where: Prisma.MachineTestProblemWhereInput = {
      isPublic: true, // Only return problems from the global bank
    };
    if (difficulty) {
      where.difficulty = difficulty;
    }

    const problems = await this.prisma.machineTestProblem.findMany({
      where,
      take: count,
      include: {
        tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return problems.map(this.transformProblem);
  }

  /**
   * Finds a single machine test problem by its ID.
   * @param id - The ID of the problem to find.
   * @returns A promise that resolves to the transformed problem.
   * @throws {NotFoundException} If the problem with the given ID is not found.
   */
  async findOne(id: number): Promise<TransformedProblem> {
    const problem = await this.prisma.machineTestProblem.findUnique({
      where: { id },
      include: {
        tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!problem) {
      throw new NotFoundException(
        `Machine test problem with ID ${id} not found.`,
      );
    }

    return this.transformProblem(problem);
  }
}

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CheckAnswerDto,
  SubmitPracticeAptitudeDto,
  GetRandomQuestionsDto,
} from './dto/aptitude.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AptitudeService {
  private readonly logger = new Logger(AptitudeService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Fetches a random set of questions based on optional filtering criteria.
   * @param count - The number of random questions to return.
   * @param query - DTO with optional 'tags' and 'difficulty' filters.
   * @returns A shuffled array of question objects.
   * @throws {NotFoundException} If no questions match the criteria.
   */
  async getRandomQuestions(count: number, query: GetRandomQuestionsDto) {
    const { tags, difficulty } = query;

    const where: Prisma.AptitudeQuestionWhereInput = {};
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          name: { in: Array.isArray(tags) ? tags : [tags] },
        },
      };
    }

    const allMatchingIds = await this.prisma.aptitudeQuestion.findMany({
      where,
      select: { id: true },
    });

    if (allMatchingIds.length === 0) {
      throw new NotFoundException(
        `No questions found matching the specified criteria.`,
      );
    }

    const shuffledIds = allMatchingIds
      .map((q) => q.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, count);

    const questions = await this.prisma.aptitudeQuestion.findMany({
      where: { id: { in: shuffledIds } },
      select: {
        id: true,
        question: true,
        options: true,
        difficulty: true,
        tags: true,
      },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    return shuffledIds.map((id) => questionMap.get(id));
  }

  /**
   * Checks if a user's selected answer for a single question is correct.
   * @param checkAnswerDto - DTO containing the question ID and the selected answer.
   * @returns An object indicating if the answer was correct and the correct answer text.
   * @throws {NotFoundException} If the question ID is invalid.
   */
  async checkAnswer(checkAnswerDto: CheckAnswerDto) {
    const { questionId, selectedAnswer } = checkAnswerDto;
    const question = await this.prisma.aptitudeQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found.`);
    }

    const isCorrect = question.correctAnswer === selectedAnswer;
    const options = question.options as { id: string; text: string }[];
    const correctOption = options.find(
      (opt) => opt.id === question.correctAnswer,
    );

    return {
      isCorrect,
      correctAnswer: correctOption?.text ?? 'Unknown',
    };
  }

  /**
   * Processes a full aptitude test submission, calculates the score, and saves the result.
   * @param submitAptitudeDto - DTO with the test type, user answers, and total questions.
   * @param userId - The ID of the user submitting the test.
   * @returns An object with detailed results, score, and percentage.
   */
  async submitAptitudeTest(
    SubmitPracticeAptitudeDto: SubmitPracticeAptitudeDto,
    userId: string,
  ) {
    const { type, answers, totalQuestions } = SubmitPracticeAptitudeDto;

    const questionIds = answers.map((a) => a.questionId);
    const questions = await this.prisma.aptitudeQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let score = 0;

    const results = answers
      .map((answer) => {
        const question = questionMap.get(answer.questionId);
        if (!question) {
          this.logger.warn(
            `Question ID ${answer.questionId} not found during submission for user ${userId}.`,
          );
          return null; // Will be filtered out later
        }

        const isCorrect = question.correctAnswer === answer.selectedOption;
        if (isCorrect) {
          score++;
        }

        const options = question.options as { id: string; text: string }[];
        const correctOption = options.find(
          (opt) => opt.id === question.correctAnswer,
        );
        const userOption = options.find(
          (opt) => opt.id === answer.selectedOption,
        );

        return {
          questionId: answer.questionId,
          correct: isCorrect,
          correctAnswer: correctOption?.text ?? 'Unknown',
          userAnswer: userOption?.text ?? 'Not answered',
        };
      })
      .filter(Boolean); // Remove any null results from missing questions

    const percentage =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    await this.prisma.aptitudeResponse.create({
      data: {
        type,
        answers: results as Prisma.JsonArray,
        score,
        total: totalQuestions,
        percentage,
        userId,
      },
    });

    return { results, score, total: totalQuestions, percentage };
  }

  /**
   * Retrieves the aptitude test history for a specific user.
   * @param userId - The ID of the user.
   * @returns An object containing the total tests taken and a list of all responses.
   * @throws {NotFoundException} If the user has no history.
   */
  async getUserAptitudeHistory(userId: string) {
    const [responses, totalTestsTaken] = await this.prisma.$transaction([
      this.prisma.aptitudeResponse.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aptitudeResponse.count({ where: { userId } }),
    ]);

    if (totalTestsTaken === 0) {
      throw new NotFoundException(
        `No aptitude history found for user with ID ${userId}.`,
      );
    }

    return { totalTestsTaken, responses };
  }
}
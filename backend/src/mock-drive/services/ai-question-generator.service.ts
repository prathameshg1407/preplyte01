import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { QuestionDifficulty } from '@prisma/client';
import { GroqService } from '../../groq/groq.service';
import { AptitudeTestConfigDto } from '../dto/aptitude-config.dto';
import { MachineTestConfigDto } from '../dto/machine-test-config.dto';

interface GeneratedAptitudeQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: QuestionDifficulty;
  topic: string;
  explanation?: string;
}

interface GeneratedCodingProblem {
  title: string;
  description: {
    problem: string;
    constraints: string[];
    examples: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
  };
  difficulty: QuestionDifficulty;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  topic: string;
  hints?: string[];
}

interface AptitudeQuestionsResponse {
  questions: GeneratedAptitudeQuestion[];
}

interface CodingProblemsResponse {
  problems: GeneratedCodingProblem[];
}

@Injectable()
export class AiQuestionGeneratorService {
  private readonly logger = new Logger(AiQuestionGeneratorService.name);

  constructor(private readonly groqService: GroqService) {}

  /**
   * Generate aptitude questions using Groq AI
   */
  async generateAptitudeQuestions(
    config: AptitudeTestConfigDto,
  ): Promise<GeneratedAptitudeQuestion[]> {
    this.logger.log('Generating aptitude questions with Groq AI...');

    const prompt = this.buildAptitudePrompt(config);

    try {
      const response = await this.groqService.createJsonCompletion<AptitudeQuestionsResponse>({
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating aptitude test questions for campus placements. 
                     Generate high-quality, diverse questions that test analytical and logical skills.
                     You must return ONLY valid JSON in the exact format specified, with no additional text or markdown.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        maxTokens: 8000,
      });

      const questions = response.questions || [];

      if (questions.length === 0) {
        throw new BadRequestException('No questions generated');
      }

      // Validate questions
      if (!this.validateAptitudeQuestions(questions)) {
        throw new BadRequestException('Generated questions validation failed');
      }

      this.logger.log(`Generated ${questions.length} aptitude questions`);
      return questions;
    } catch (error) {
      this.logger.error('Error generating aptitude questions:', error);
      throw new BadRequestException(`Failed to generate aptitude questions: ${error.message}`);
    }
  }

  /**
   * Generate coding problems using Groq AI
   */
  async generateCodingProblems(
    config: MachineTestConfigDto,
  ): Promise<GeneratedCodingProblem[]> {
    this.logger.log('Generating coding problems with Groq AI...');

    const prompt = this.buildCodingPrompt(config);

    try {
      const response = await this.groqService.createJsonCompletion<CodingProblemsResponse>({
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating coding problems for technical assessments.
                     Generate well-structured problems with clear descriptions, examples, and comprehensive test cases.
                     You must return ONLY valid JSON in the exact format specified, with no additional text or markdown.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        maxTokens: 8000,
      });

      const problems = response.problems || [];

      if (problems.length === 0) {
        throw new BadRequestException('No problems generated');
      }

      // Validate problems
      if (!this.validateCodingProblems(problems)) {
        throw new BadRequestException('Generated problems validation failed');
      }

      this.logger.log(`Generated ${problems.length} coding problems`);
      return problems;
    } catch (error) {
      this.logger.error('Error generating coding problems:', error);
      throw new BadRequestException(`Failed to generate coding problems: ${error.message}`);
    }
  }

  /**
   * Build prompt for aptitude questions
   */
  private buildAptitudePrompt(config: AptitudeTestConfigDto): string {
    let distributionText = '';
    
    if (config.questionDistribution && config.questionDistribution.length > 0) {
      distributionText = config.questionDistribution
        .map(dist => {
          const topics = dist.topics?.join(', ') || 'General';
          return `- ${dist.count} ${dist.difficulty} questions on: ${topics}`;
        })
        .join('\n');
    } else {
      // Default distribution
      const easyCount = Math.floor(config.totalQuestions * 0.4);
      const mediumCount = Math.floor(config.totalQuestions * 0.4);
      const hardCount = config.totalQuestions - easyCount - mediumCount;
      
      distributionText = `- ${easyCount} EASY questions
- ${mediumCount} MEDIUM questions
- ${hardCount} HARD questions`;
    }

    return `Generate ${config.totalQuestions} aptitude test questions with the following distribution:

${distributionText}

Topics should cover:
- Quantitative Aptitude (arithmetic, algebra, geometry, data interpretation)
- Logical Reasoning (patterns, sequences, blood relations, coding-decoding)
- Verbal Ability (synonyms, antonyms, sentence correction, reading comprehension)

Return a JSON object with this EXACT structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "A",
      "difficulty": "EASY",
      "topic": "Quantitative Aptitude - Arithmetic",
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}

Requirements:
- Questions should be diverse and test different skills
- Options should be plausible and not obviously wrong
- Include a mix of quantitative, logical, and verbal questions
- Difficulty should be appropriate for campus placements
- Each question must have exactly 4 options (A, B, C, D)
- correctAnswer must be one of: "A", "B", "C", or "D"
- difficulty must be one of: "EASY", "MEDIUM", or "HARD"
- Include clear explanations for learning purposes
- Questions should be professional and error-free
- Avoid culturally specific references`;
  }

  /**
   * Build prompt for coding problems
   */
  private buildCodingPrompt(config: MachineTestConfigDto): string {
    let distributionText = '';
    
    if (config.problemDistribution && config.problemDistribution.length > 0) {
      distributionText = config.problemDistribution
        .map(dist => {
          const topics = dist.topics?.join(', ') || 'General DSA';
          return `- ${dist.count} ${dist.difficulty} problems (${dist.pointsPerProblem} points each) on: ${topics}`;
        })
        .join('\n');
    } else {
      // Default distribution
      const easyCount = Math.floor(config.totalProblems * 0.3);
      const mediumCount = Math.floor(config.totalProblems * 0.5);
      const hardCount = config.totalProblems - easyCount - mediumCount;
      
      distributionText = `- ${easyCount} EASY problems (100 points each)
- ${mediumCount} MEDIUM problems (200 points each)
- ${hardCount} HARD problems (300 points each)`;
    }

    return `Generate ${config.totalProblems} coding problems with the following distribution:

${distributionText}

Topics should cover data structures and algorithms like:
- Arrays, Strings, Linked Lists
- Stacks, Queues, Hash Maps
- Trees, Graphs
- Dynamic Programming, Greedy Algorithms
- Sorting, Searching

Return a JSON object with this EXACT structure:
{
  "problems": [
    {
      "title": "Problem Title",
      "description": {
        "problem": "Detailed problem description explaining what needs to be solved",
        "constraints": [
          "1 <= n <= 10^5",
          "All elements are positive integers",
          "Time limit: 1 second per test case"
        ],
        "examples": [
          {
            "input": "n = 5\\narr = [1, 2, 3, 4, 5]",
            "output": "15",
            "explanation": "Sum of all elements is 1+2+3+4+5 = 15"
          }
        ]
      },
      "difficulty": "EASY",
      "testCases": [
        {
          "input": "5\\n1 2 3 4 5",
          "expectedOutput": "15",
          "isHidden": false
        },
        {
          "input": "3\\n10 20 30",
          "expectedOutput": "60",
          "isHidden": false
        },
        {
          "input": "1\\n100",
          "expectedOutput": "100",
          "isHidden": true
        }
      ],
      "topic": "Arrays",
      "hints": [
        "Think about iterating through the array",
        "You can solve this in O(n) time complexity"
      ]
    }
  ]
}

Requirements:
- Problems should be realistic and relevant to campus placements
- Include at least 3 example test cases in description
- Provide 8-12 total test cases per problem (mix of visible and hidden)
- Test cases should cover:
  * Normal cases
  * Edge cases (empty input, single element, maximum size)
  * Boundary conditions
  * Corner cases
- Mark at least 50% of test cases as hidden (isHidden: true)
- difficulty must be one of: "EASY", "MEDIUM", or "HARD"
- Provide clear constraints (time/space complexity, input size limits)
- Input/output format should be clear and consistent
- Include helpful hints without giving away the solution
- Problems should have single, deterministic solutions`;
  }

  /**
   * Validate generated aptitude questions
   */
  validateAptitudeQuestions(questions: GeneratedAptitudeQuestion[]): boolean {
    try {
      for (const q of questions) {
        if (!q.question || typeof q.question !== 'string') {
          this.logger.error('Invalid question text');
          return false;
        }

        if (!q.options || typeof q.options !== 'object') {
          this.logger.error('Invalid options');
          return false;
        }

        if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
          this.logger.error(`Invalid correctAnswer: ${q.correctAnswer}`);
          return false;
        }

        if (!['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty)) {
          this.logger.error(`Invalid difficulty: ${q.difficulty}`);
          return false;
        }

        const { A, B, C, D } = q.options;
        if (!A || !B || !C || !D) {
          this.logger.error('Missing option');
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Validation error:', error);
      return false;
    }
  }

  /**
   * Validate generated coding problems
   */
  validateCodingProblems(problems: GeneratedCodingProblem[]): boolean {
    try {
      for (const p of problems) {
        if (!p.title || typeof p.title !== 'string') {
          this.logger.error('Invalid title');
          return false;
        }

        if (!p.description || typeof p.description !== 'object') {
          this.logger.error('Invalid description');
          return false;
        }

        if (!['EASY', 'MEDIUM', 'HARD'].includes(p.difficulty)) {
          this.logger.error(`Invalid difficulty: ${p.difficulty}`);
          return false;
        }

        if (!Array.isArray(p.testCases) || p.testCases.length < 3) {
          this.logger.error('Insufficient test cases');
          return false;
        }

        if (!p.description.problem || !p.description.examples || p.description.examples.length < 1) {
          this.logger.error('Invalid description structure');
          return false;
        }

        // Validate test cases
        for (const tc of p.testCases) {
          if (!tc.input || !tc.expectedOutput || typeof tc.isHidden !== 'boolean') {
            this.logger.error('Invalid test case structure');
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Validation error:', error);
      return false;
    }
  }
}
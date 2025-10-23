import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileService } from 'src/profile/profile.service';
import {
  StartInterviewSessionDto,
  SubmitAnswerDto,
  InterviewSessionResponseDto,
  InterviewFeedbackResponseDto,
  QuestionItemDto,
  ResponseScoreDto,
  UserSessionSummaryDto,
} from './dto/ai-interview.dto';
import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import {
  AiInterviewSession,
  AiInterviewResponse,
  AiInterviewSessionStatus,
  AiInterviewQuestionCategory,
  Prisma,
} from '@prisma/client';
import { JWT } from 'google-auth-library';

// ============= Constants =============
const CONSTANTS = {
  MIN_RESUME_LENGTH: 50,
  MAX_QUESTIONS: 10,
  DEDUP_TIMEOUT_MS: 1000,
  API_RETRY_COUNT: 3,
  RETRY_DELAY_MS: 1000,
  MAX_PROMPT_LENGTH: 4000,
  DEFAULT_JOB_TITLE: 'Developer',
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  GROQ_TEMPERATURE: 0.7,
  MAX_TIME_SECONDS: 600,
  AUDIO_DIR: '../../audio',
  TTS_LANGUAGE: 'en-US',
} as const;

// ============= Interfaces =============
export interface AnswerScore {
  contentScore: number;
  fluencyScore: number;
  relevanceScore: number;
  feedback: string;
  weakSection?: string;
  [key: string]: any; // Added for Prisma compatibility
}

export interface QuestionItem {
  category: AiInterviewQuestionCategory;
  text: string;
}

export interface Questions {
  questions: QuestionItem[];
}

export interface SessionContext {
  jobTitle: string;
  companyName?: string;
  resumeText?: string;
}

// ============= Utility Classes =============
/**
 * Helper class for Prisma JSON conversions
 */
class PrismaJsonHelper {
  static toJson<T>(data: T): Prisma.InputJsonValue {
    return data as unknown as Prisma.InputJsonValue;
  }
  
  static fromJson<T>(json: Prisma.JsonValue): T {
    return json as unknown as T;
  }
}

/**
 * Handles Groq API interactions with retry logic and key rotation
 */
class GroqApiManager {
  private groq: Groq;
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private readonly logger = new Logger(GroqApiManager.name);

  constructor(apiKeys: string[]) {
    this.apiKeys = apiKeys.filter(Boolean);
    if (this.apiKeys.length === 0) {
      throw new Error('No Groq API keys found');
    }
    this.initializeClient();
  }

  private initializeClient(): void {
    const apiKey = this.apiKeys[this.currentKeyIndex];
    this.groq = new Groq({ apiKey });
    this.logger.log(`Initialized with API key index: ${this.currentKeyIndex}`);
  }

  private rotateKey(): void {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.initializeClient();
    this.logger.warn(`Rotated to API key index: ${this.currentKeyIndex}`);
  }

  async callApi(prompt: string): Promise<Groq.Chat.Completions.ChatCompletion> {
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      try {
        const result = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: CONSTANTS.GROQ_MODEL,
          temperature: CONSTANTS.GROQ_TEMPERATURE,
          response_format: { type: 'json_object' },
        });
        
        this.logger.debug(`API call successful on attempt ${attempt + 1}`);
        return result;
      } catch (error) {
        this.logger.error(`API call failed with key ${this.currentKeyIndex}:`, error);
        this.rotateKey();
        
        if (attempt === this.apiKeys.length - 1) {
          throw new InternalServerErrorException('All API keys exhausted');
        }
      }
    }
    throw new InternalServerErrorException('API call failed');
  }
}

/**
 * Handles Text-to-Speech generation
 */
/**
 * Handles Text-to-Speech generation
 */
class TTSManager {
  private ttsClient: TextToSpeechClient;
  private readonly logger = new Logger(TTSManager.name);
  private audioCache = new Map<string, string>();

  constructor(configService?: ConfigService) {
    try {
      // Get credentials path from environment
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                              configService?.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
  
      this.logger.log(`Initializing TTS with credentials: ${credentialsPath || 'default ADC'}`);
  
      // Verify credentials file exists
      if (credentialsPath) {
        const fs = require('fs');
        const path = require('path');
        
        const absolutePath = path.resolve(credentialsPath);
        
        if (!fs.existsSync(absolutePath)) {
          throw new Error(`Credentials file not found at: ${absolutePath}`);
        }
  
        this.logger.log(`✅ Credentials file found: ${absolutePath}`);
  
        // ✅ Read credentials JSON
        const credentialsJson = JSON.parse(
          fs.readFileSync(absolutePath, 'utf8')
        );
  
        // ✅ CORRECT: Use credentials object
        this.ttsClient = new TextToSpeechClient({
          credentials: {
            client_email: credentialsJson.client_email,
            private_key: credentialsJson.private_key,
          },
          projectId: credentialsJson.project_id,
        });
      } else {
        // Fallback to Application Default Credentials
        this.logger.warn('⚠️  No explicit credentials path found, using ADC');
        this.ttsClient = new TextToSpeechClient();
      }
  
      this.logger.log('✅ TTS client initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize TTS client:', error);
      throw new InternalServerErrorException('TTS initialization failed');
    }
  }

  async generateAudio(text: string, sessionId: string): Promise<string> {
    const cacheKey = `${sessionId}:${text.substring(0, 50)}`;
    
    if (this.audioCache.has(cacheKey)) {
      this.logger.debug(`Using cached audio for session ${sessionId}`);
      return this.audioCache.get(cacheKey)!;
    }

    const audioDir = resolve(__dirname, CONSTANTS.AUDIO_DIR);
    await mkdir(audioDir, { recursive: true });
    
    const fileName = `${sessionId}_${Date.now()}.mp3`;
    const filePath = join(audioDir, fileName);

    try {
      this.logger.debug(`Generating TTS for session ${sessionId}`);

      const [response] = await this.ttsClient.synthesizeSpeech({
        input: { text },
        voice: { 
          languageCode: CONSTANTS.TTS_LANGUAGE, 
          ssmlGender: 'NEUTRAL' 
        },
        audioConfig: { 
          audioEncoding: 'MP3' 
        },
      });

      if (!response.audioContent) {
        throw new Error('No audio content received from TTS service');
      }

      await writeFile(filePath, response.audioContent as Buffer);
      const url = `/audio/${fileName}`;
      
      this.audioCache.set(cacheKey, url);
      this.logger.debug(`✅ Audio generated successfully: ${fileName}`);
      
      return url;
    } catch (error) {
      this.logger.error('❌ TTS generation failed:', error);
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      throw new InternalServerErrorException('Audio generation failed');
    }
  }

  /**
   * Test TTS connection
   */
  async testConnection(): Promise<boolean> {
    try {
      this.logger.log('Testing TTS connection...');
      const [result] = await this.ttsClient.listVoices({});
      this.logger.log(`✅ TTS connected! Available voices: ${result.voices?.length || 0}`);
      return true;
    } catch (error) {
      this.logger.error('❌ TTS connection test failed:', error);
      return false;
    }
  }
}
/**
 * Handles JSON parsing with fallback strategies
 */
class JsonParser {
  private readonly logger = new Logger(JsonParser.name);

  parse<T>(input: string, context: string): T {
    // Try direct parse first
    try {
      return JSON.parse(input) as T;
    } catch {
      return this.extractAndParse<T>(input, context);
    }
  }

  private extractAndParse<T>(input: string, context: string): T {
    // Extract JSON from potentially malformed response
    const jsonMatch = input.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.error(`No JSON found in ${context}`);
      throw new Error('JSON extraction failed');
    }

    let jsonStr = jsonMatch[0];
    
    // Clean up common issues
    jsonStr = jsonStr
      .replace(/```(?:json)?/gi, '')
      .replace(/,\s*([}```])/g, '$1')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    try {
      const parsed = JSON.parse(jsonStr) as T;
      this.logger.debug(`Successfully parsed JSON for ${context}`);
      return parsed;
    } catch (error) {
      this.logger.error(`JSON parse failed for ${context}:`, error);
      throw new Error('Invalid JSON structure');
    }
  }
}

/**
 * Main AI Interview Service
 */
@Injectable()
export class AiInterviewService {
  private readonly logger = new Logger(AiInterviewService.name);
  private readonly groqManager: GroqApiManager;
  private readonly ttsManager: TTSManager;
  private readonly jsonParser: JsonParser;
  private readonly requestDedup = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly profileService: ProfileService,
  ) {
    // Initialize managers
    const apiKeys = [
      this.configService.get<string>('GROQ_API_KEY_1'),
      this.configService.get<string>('GROQ_API_KEY_2'),
    ].filter(Boolean) as string[];

    this.groqManager = new GroqApiManager(apiKeys);
    this.ttsManager = new TTSManager(this.configService);
    this.jsonParser = new JsonParser();


    this.testTTSConnection();
  }
  private async testTTSConnection(): Promise<void> {
    try {
      await this.ttsManager.testConnection();
    } catch (error) {
      this.logger.error('TTS connection test failed on startup:', error);
    }
  }
  // ============= Public Methods =============
  async startInterviewSession(
    userId: string,
    dto: StartInterviewSessionDto
  ): Promise<InterviewSessionResponseDto> {
    this.logger.log(`Starting session for user ${userId}`);
    
    // Deduplication check
    if (this.isDuplicateRequest(`start:${userId}:${JSON.stringify(dto)}`)) {
      throw new ConflictException('Duplicate request detected');
    }

    // Build session context
    const context = await this.buildSessionContext(userId, dto);
    
    // Generate questions
    const questions = await this.generateInitialQuestions(context);
    
    // Create session
    const session = await this.createSession(userId, context, questions, dto.resumeId);
    
    // Generate audio for first question
    const audioUrl = await this.ttsManager.generateAudio(
      questions[0].text,
      session.id
    );

    return this.formatSessionResponse(session, questions, audioUrl);
  }

  async submitAnswer(
    sessionId: string,
    userId: string,
    dto: SubmitAnswerDto
  ): Promise<any> {
    this.logger.log(`Submitting answer for session ${sessionId}`);

    // Validate session
    const session = await this.validateSession(sessionId, userId);
    
    // Score the answer
    const scores = await this.scoreAnswer(dto, session);
    
    // Save response
    const response = await this.saveResponse(sessionId, dto, scores, session);
    
    // Process next question or complete
    return this.processNextStep(session, dto.answer);
  }

  async getInterviewFeedback(
    sessionId: string,
    userId: string
  ): Promise<InterviewFeedbackResponseDto> {
    this.logger.log(`Getting feedback for session ${sessionId}`);

    const session = await this.getCompletedSession(sessionId, userId);
    
    // Check for existing feedback
    if (session.feedback) {
      return this.formatExistingFeedback(session.feedback);
    }

    // Generate new feedback
    return this.generateAndSaveFeedback(session);
  }

  async getInterviewSession(sessionId: string, userId: string): Promise<any> {
    const session = await this.validateSession(sessionId, userId);
    const questions = this.parseQuestions(session.questions);
    const currentQuestion = questions[session.currentQuestionIndex];
    
    return {
      id: session.id,
      userId: session.userId,
      questions: questions.map(q => ({
        category: q.category,
        text: q.text,
      })),
      currentQuestion,
      currentQuestionIndex: session.currentQuestionIndex,
      audioUrl: `/audio/${sessionId}_question.mp3`,
    };
  }

  async getNextQuestion(sessionId: string, userId: string): Promise<any> {
    if (this.isDuplicateRequest(`next:${sessionId}`)) {
      throw new ConflictException('Duplicate request detected');
    }

    const session = await this.validateSession(sessionId, userId);
    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= CONSTANTS.MAX_QUESTIONS) {
      await this.completeSession(sessionId);
      return { isComplete: true, message: 'Interview complete' };
    }

    const questions = this.parseQuestions(session.questions);
    const nextQuestion = questions[nextIndex];
    const audioUrl = await this.ttsManager.generateAudio(nextQuestion.text, sessionId);

    return {
      question: nextQuestion.text,
      category: nextQuestion.category,
      index: nextIndex,
      audioUrl,
      totalQuestions: CONSTANTS.MAX_QUESTIONS,
    };
  }

  // ============= Private Helper Methods =============
  private isDuplicateRequest(key: string): boolean {
    if (this.requestDedup.has(key)) {
      this.logger.debug(`Duplicate request: ${key}`);
      return true;
    }
    
    const timeout = setTimeout(
      () => this.requestDedup.delete(key),
      CONSTANTS.DEDUP_TIMEOUT_MS
    );
    this.requestDedup.set(key, timeout);
    return false;
  }

  private async buildSessionContext(
    userId: string,
    dto: StartInterviewSessionDto
  ): Promise<SessionContext> {
    let resumeText: string | undefined;

    if (dto.resumeId) {
      resumeText = await this.extractResumeText(userId, dto.resumeId);
    }

    return {
      jobTitle: dto.jobTitle?.trim() || CONSTANTS.DEFAULT_JOB_TITLE,
      companyName: dto.companyName?.trim(),
      resumeText,
    };
  }

  private async extractResumeText(userId: string, resumeId: number): Promise<string> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException(`Resume ${resumeId} not found`);
    }

    // Return cached content if available
    if (resume.content) {
      return resume.content;
    }

    // Extract from PDF
    try {
      const file = await this.profileService.getResumeFile(userId, resumeId);
      const parsed = await pdfParse(file.buffer);
      
      if (parsed.text.trim().length < CONSTANTS.MIN_RESUME_LENGTH) {
        throw new BadRequestException('Resume appears to be empty or image-based');
      }

      // Cache the content
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: { content: parsed.text },
      });

      return parsed.text;
    } catch (error) {
      this.logger.error('Resume extraction failed:', error);
      throw new InternalServerErrorException('Failed to process resume');
    }
  }

  private async generateInitialQuestions(context: SessionContext): Promise<QuestionItem[]> {
    const prompt = this.buildQuestionsPrompt(context);
    
    try {
      const result = await this.groqManager.callApi(prompt);
      const content = result.choices?.[0]?.message?.content || '';
      const parsed = this.jsonParser.parse<Questions>(content, 'questions');
      
      return this.normalizeQuestions(parsed.questions);
    } catch (error) {
      this.logger.error('Question generation failed:', error);
      return this.getFallbackQuestions(context.jobTitle);
    }
  }

  private buildQuestionsPrompt(context: SessionContext): string {
    const { jobTitle, companyName, resumeText } = context;
    const roleContext = `${jobTitle}${companyName ? ` at ${companyName}` : ''}`;
    const resumeContext = resumeText?.slice(0, CONSTANTS.MAX_PROMPT_LENGTH) || 'No resume';

    return `
      Generate 10 interview questions for ${roleContext}.
      Structure: 1 INTRODUCTORY, 8 TECHNICAL, 1 CLOSING.
      Resume: "${resumeContext}"
      Output JSON: {"questions": [{"category": "INTRODUCTORY|TECHNICAL|CLOSING", "text": "question"}]}
    `;
  }

  private normalizeQuestions(questions: QuestionItem[]): QuestionItem[] {
    const normalized: QuestionItem[] = [];
    
    // Ensure proper structure
    const intro = questions.find(q => q.category === AiInterviewQuestionCategory.INTRODUCTORY) ||
      { category: AiInterviewQuestionCategory.INTRODUCTORY, text: 'Tell me about yourself.' };
    
    const tech = questions
      .filter(q => q.category === AiInterviewQuestionCategory.TECHNICAL)
      .slice(0, 8);
    
    while (tech.length < 8) {
      tech.push({
        category: AiInterviewQuestionCategory.TECHNICAL,
        text: 'Describe a technical challenge you faced.',
      });
    }
    
    const closing = questions.find(q => q.category === AiInterviewQuestionCategory.CLOSING) ||
      { category: AiInterviewQuestionCategory.CLOSING, text: 'Do you have any questions?' };

    return [intro, ...tech, closing];
  }

  private getFallbackQuestions(jobTitle: string): QuestionItem[] {
    return [
      { 
        category: AiInterviewQuestionCategory.INTRODUCTORY, 
        text: `Tell me about yourself and your interest in the ${jobTitle} role.` 
      },
      ...Array(8).fill(null).map((_, i) => ({
        category: AiInterviewQuestionCategory.TECHNICAL,
        text: this.getTechnicalQuestionByIndex(i, jobTitle),
      })),
      { 
        category: AiInterviewQuestionCategory.CLOSING, 
        text: 'What questions do you have about our team or company?' 
      },
    ];
  }

  private getTechnicalQuestionByIndex(index: number, jobTitle: string): string {
    const questions = [
      `What programming languages are you most proficient in?`,
      `Describe your experience with data structures and algorithms.`,
      `How do you approach debugging complex issues?`,
      `Tell me about a challenging project you've worked on.`,
      `How do you ensure code quality in your projects?`,
      `Describe your experience with version control and CI/CD.`,
      `How do you stay updated with new technologies?`,
      `What's your approach to system design and architecture?`,
    ];
    return questions[index] || `Describe your technical experience relevant to ${jobTitle}.`;
  }

  private async createSession(
    userId: string,
    context: SessionContext,
    questions: QuestionItem[],
    resumeId?: number
  ): Promise<AiInterviewSession> {
    const sessionData: Prisma.AiInterviewSessionCreateInput = {
      user: { connect: { id: userId } },
      resume: resumeId ? { connect: { id: resumeId } } : undefined,
      jobTitle: context.jobTitle,
      companyName: context.companyName,
      questions: PrismaJsonHelper.toJson({ questions }),
      totalQuestions: CONSTANTS.MAX_QUESTIONS,
      currentQuestionIndex: 0,
      status: AiInterviewSessionStatus.STARTED,
    };

    return this.prisma.aiInterviewSession.create({ data: sessionData });
  }

  private formatSessionResponse(
    session: AiInterviewSession,
    questions: QuestionItem[],
    audioUrl: string
  ): InterviewSessionResponseDto {
    return {
      id: session.id,
      userId: session.userId,
      questions: questions.map(q => ({
        category: q.category,
        text: q.text,
      } as QuestionItemDto)),
      createdAt: session.createdAt,
    };
  }

  private async validateSession(
    sessionId: string,
    userId: string
  ): Promise<AiInterviewSession & { responses?: AiInterviewResponse[]; resume?: any }> {
    const session = await this.prisma.aiInterviewSession.findFirst({
      where: { id: sessionId, userId },
      include: { responses: true, resume: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (session.status === AiInterviewSessionStatus.COMPLETED) {
      throw new ConflictException('Session already completed');
    }

    return session;
  }

  private async scoreAnswer(
    dto: SubmitAnswerDto,
    session: AiInterviewSession & { resume?: any }
  ): Promise<AnswerScore> {
    const context = `Job: ${session.jobTitle}, Resume: ${session.resume?.content || 'N/A'}`;
    const prompt = this.buildScoringPrompt(dto, context);

    try {
      const result = await this.groqManager.callApi(prompt);
      const content = result.choices?.[0]?.message?.content || '';
      return this.jsonParser.parse<AnswerScore>(content, 'score');
    } catch (error) {
      this.logger.error('Scoring failed:', error);
      return this.getDefaultScore();
    }
  }

  private buildScoringPrompt(dto: SubmitAnswerDto, context: string): string {
    const transcribedNote = dto.isTranscribed ? ' (transcribed)' : '';
    return `
      Score this interview answer:
      Question: "${dto.question}"
      Answer: "${dto.answer}"${transcribedNote}
      Context: ${context}
      
      Output JSON:
      {
        "contentScore": 0-10,
        "fluencyScore": 0-10,
        "relevanceScore": 0-10,
        "feedback": "constructive feedback",
        "weakSection": "area needing improvement"
      }
    `;
  }

  private getDefaultScore(): AnswerScore {
    return {
      contentScore: 5,
      fluencyScore: 5,
      relevanceScore: 5,
      feedback: 'Unable to generate detailed feedback at this time.',
      weakSection: '',
    };
  }

  private async saveResponse(
    sessionId: string,
    dto: SubmitAnswerDto,
    scores: AnswerScore,
    session: AiInterviewSession
  ): Promise<AiInterviewResponse> {
    return this.prisma.aiInterviewResponse.create({
      data: {
        sessionId,
        category: dto.category,
        question: dto.question,
        answer: dto.answer,
        isFollowup: session.currentQuestionIndex > 0,
        scoresJson: PrismaJsonHelper.toJson(scores),
        feedbackText: scores.feedback,
        timeTakenSeconds: dto.timeTakenSeconds,
      },
    });
  }

  private async processNextStep(
    session: AiInterviewSession & { responses?: AiInterviewResponse[] },
    lastAnswer: string
  ): Promise<any> {
    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= CONSTANTS.MAX_QUESTIONS) {
      await this.completeSession(session.id);
      const audioUrl = await this.ttsManager.generateAudio(
        'Thank you for completing the interview.',
        session.id
      );
      return {
        isComplete: true,
        message: 'Interview completed!',
        audioUrl,
      };
    }

    const questions = this.parseQuestions(session.questions);
    const nextQuestion = await this.generateFollowupQuestion(
      questions[session.currentQuestionIndex],
      lastAnswer,
      session
    );

    // Update session
    questions[nextIndex] = nextQuestion;
    await this.prisma.aiInterviewSession.update({
      where: { id: session.id },
      data: {
        questions: PrismaJsonHelper.toJson({ questions }),
        currentQuestionIndex: nextIndex,
        status: AiInterviewSessionStatus.IN_PROGRESS,
      },
    });

    const audioUrl = await this.ttsManager.generateAudio(nextQuestion.text, session.id);

    return {
      nextQuestion: {
        category: nextQuestion.category,
        text: nextQuestion.text,
      },
      isComplete: false,
      audioUrl,
    };
  }

  private async generateFollowupQuestion(
    currentQuestion: QuestionItem,
    answer: string,
    session: AiInterviewSession & { resume?: any }
  ): Promise<QuestionItem> {
    const prompt = `
      Generate a follow-up question based on:
      Previous: "${currentQuestion.text}"
      Answer: "${answer}"
      Role: ${session.jobTitle}
      
      Output JSON: {"question": "follow-up question text"}
    `;

    try {
      const result = await this.groqManager.callApi(prompt);
      const content = result.choices?.[0]?.message?.content || '';
      const parsed = this.jsonParser.parse<{ question: string }>(content, 'followup');
      
      return {
        category: AiInterviewQuestionCategory.TECHNICAL,
        text: parsed.question,
      };
    } catch (error) {
      this.logger.error('Follow-up generation failed:', error);
      return {
        category: AiInterviewQuestionCategory.TECHNICAL,
        text: `Can you elaborate on your experience with ${session.jobTitle}?`,
      };
    }
  }

  private async completeSession(sessionId: string): Promise<void> {
    await this.prisma.aiInterviewSession.update({
      where: { id: sessionId },
      data: {
        status: AiInterviewSessionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  private parseQuestions(questionsData: any): QuestionItem[] {
    try {
      const parsed = questionsData as Questions;
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }
    } catch (error) {
      this.logger.error('Failed to parse questions:', error);
    }
    
    return this.getFallbackQuestions(CONSTANTS.DEFAULT_JOB_TITLE);
  }

  private async getCompletedSession(sessionId: string, userId: string): Promise<any> {
    const session = await this.prisma.aiInterviewSession.findFirst({
      where: { id: sessionId, userId },
      include: { responses: true, feedback: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (session.status !== AiInterviewSessionStatus.COMPLETED) {
      throw new BadRequestException('Session not completed');
    }

    return session;
  }

  private formatExistingFeedback(feedback: any): InterviewFeedbackResponseDto {
    const json = feedback.feedbackJson as any;
    return {
      overallScore: feedback.overallScore,
      overallSummary: feedback.overallSummary,
      keyStrengths: feedback.keyStrengths,
      areasForImprovement: feedback.areasForImprovement,
      weakSections: json?.weakSections || [],
      perResponseScores: json?.perResponseScores || [],
    };
  }

  private async generateAndSaveFeedback(
    session: AiInterviewSession & { responses: AiInterviewResponse[] }
  ): Promise<InterviewFeedbackResponseDto> {
    const feedbackData = await this.generateFeedback(session);
    
    const saved = await this.prisma.aiInterviewFeedback.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        overallScore: feedbackData.overallScore,
        overallSummary: feedbackData.overallSummary,
        keyStrengths: feedbackData.keyStrengths,
        areasForImprovement: feedbackData.areasForImprovement,
        feedbackJson: PrismaJsonHelper.toJson(feedbackData),
      },
    });

    return this.formatExistingFeedback(saved);
  }

  private async generateFeedback(
    session: AiInterviewSession & { responses: AiInterviewResponse[] }
  ): Promise<InterviewFeedbackResponseDto> {
    const prompt = this.buildFeedbackPrompt(session);

    try {
      const result = await this.groqManager.callApi(prompt);
      const content = result.choices?.[0]?.message?.content || '';
      const parsed = this.jsonParser.parse<any>(content, 'feedback');
      
      return this.normalizeFeedback(parsed, session.responses);
    } catch (error) {
      this.logger.error('Feedback generation failed:', error);
      return this.getDefaultFeedback(session.responses);
    }
  }

  private buildFeedbackPrompt(
    session: AiInterviewSession & { responses: AiInterviewResponse[] }
  ): string {
    const answers = session.responses
      .map(r => `Q: ${r.question}\nA: ${r.answer}`)
      .join('\n\n');

    return `
      Analyze this interview for ${session.jobTitle} at ${session.companyName || 'company'}:
      
      ${answers}
      
      Output JSON:
      {
        "overallScore": 0-100,
        "overallSummary": "comprehensive summary",
        "keyStrengths": ["strength1", "strength2"],
        "areasForImprovement": ["area1", "area2"],
        "weakSections": ["section1", "section2"]
      }
    `;
  }

  private normalizeFeedback(
    raw: any,
    responses: AiInterviewResponse[]
  ): InterviewFeedbackResponseDto {
    const scores = responses.map(r => {
      const json = r.scoresJson as any;
      return {
        contentScore: json?.contentScore || 5,
        fluencyScore: json?.fluencyScore || 5,
        relevanceScore: json?.relevanceScore || 5,
        feedback: json?.feedback || '',
      };
    });

    const avgScore = scores.reduce((sum, s) => 
      sum + (s.contentScore + s.fluencyScore + s.relevanceScore) / 3, 0
    ) / (scores.length || 1);

    return {
      overallScore: Math.round(avgScore * 10),
      overallSummary: raw.overallSummary || 'Interview completed',
      keyStrengths: Array.isArray(raw.keyStrengths) ? raw.keyStrengths : [],
      areasForImprovement: Array.isArray(raw.areasForImprovement) ? raw.areasForImprovement : [],
      weakSections: Array.isArray(raw.weakSections) ? raw.weakSections : [],
      perResponseScores: scores,
    };
  }

  private getDefaultFeedback(responses: AiInterviewResponse[]): InterviewFeedbackResponseDto {
    return {
      overallScore: 70,
      overallSummary: 'Interview completed successfully',
      keyStrengths: ['Communication skills', 'Technical knowledge'],
      areasForImprovement: ['Deep dive into specifics', 'Time management'],
      weakSections: [],
      perResponseScores: responses.map(() => ({
        contentScore: 7,
        fluencyScore: 7,
        relevanceScore: 7,
        feedback: 'Good response',
      })),
    };
  }

  /**
 * Get all interview sessions for a user
 */
/**
 * Get all interview sessions for a user
 */
async getUserSessions(userId: string): Promise<UserSessionSummaryDto[]> {
  this.logger.log(`Fetching all sessions for user ${userId}`);

  try {
    const sessions = await this.prisma.aiInterviewSession.findMany({
      where: { userId },
      include: {
        responses: {
          select: {
            id: true,
          },
        },
        feedback: {
          select: {
            overallScore: true,
          },
        },
        resume: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map(session => ({
      id: session.id,
      jobTitle: session.jobTitle || 'General Interview', // Provide default for null
      companyName: session.companyName,
      resumeId: session.resume?.id || null,
      status: session.status,
      totalQuestions: session.totalQuestions,
      answeredQuestions: session.responses.length,
      currentQuestionIndex: session.currentQuestionIndex,
      overallScore: session.feedback?.overallScore 
        ? Number(session.feedback.overallScore) 
        : null,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      hasFeedback: !!session.feedback,
    }));
  } catch (error) {
    this.logger.error(`Failed to fetch sessions for user ${userId}:`, error);
    throw new InternalServerErrorException('Failed to fetch user sessions');
  }
}

/**
 * Cancel an active interview session
 */
async cancelSession(sessionId: string, userId: string): Promise<void> {
  this.logger.log(`Cancelling session ${sessionId} for user ${userId}`);

  const session = await this.prisma.aiInterviewSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new NotFoundException(`Session ${sessionId} not found`);
  }

  if (session.status === AiInterviewSessionStatus.COMPLETED) {
    throw new BadRequestException('Cannot cancel a completed session');
  }

  try {
    await this.prisma.aiInterviewSession.update({
      where: { id: sessionId },
      data: {
        status: AiInterviewSessionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    this.logger.log(`Session ${sessionId} cancelled successfully`);
  } catch (error) {
    this.logger.error(`Failed to cancel session ${sessionId}:`, error);
    throw new InternalServerErrorException('Failed to cancel session');
  }
}

/**
 * Delete an interview session (soft delete or hard delete based on your needs)
 */
async deleteSession(sessionId: string, userId: string): Promise<void> {
  this.logger.log(`Deleting session ${sessionId} for user ${userId}`);

  const session = await this.prisma.aiInterviewSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new NotFoundException(`Session ${sessionId} not found`);
  }

  try {
    // Hard delete - remove all related data
    await this.prisma.$transaction([
      // Delete responses first (foreign key constraint)
      this.prisma.aiInterviewResponse.deleteMany({
        where: { sessionId },
      }),
      // Delete feedback
      this.prisma.aiInterviewFeedback.deleteMany({
        where: { sessionId },
      }),
      // Delete session
      this.prisma.aiInterviewSession.delete({
        where: { id: sessionId },
      }),
    ]);

    this.logger.log(`Session ${sessionId} deleted successfully`);
  } catch (error) {
    this.logger.error(`Failed to delete session ${sessionId}:`, error);
    throw new InternalServerErrorException('Failed to delete session');
  }
}

/**
 * Get session statistics for a user
 */
/**
 * Get session statistics for a user
 */
async getUserSessionStats(userId: string): Promise<{
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  averageScore: number;
  totalQuestionsAnswered: number;
}> {
  this.logger.log(`Fetching session statistics for user ${userId}`);

  try {
    const sessions = await this.prisma.aiInterviewSession.findMany({
      where: { userId },
      include: {
        responses: true,
        feedback: true,
      },
    });

    const completedSessions = sessions.filter(
      s => s.status === AiInterviewSessionStatus.COMPLETED
    );

    // Handle Decimal type properly
    const scores: number[] = completedSessions
    .map(s => s.feedback?.overallScore)
    .filter((score): score is NonNullable<typeof score> => {
      // Filter out null and undefined
      return score !== null && score !== undefined;
    })
    .map(score => Number(score)); 

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    const totalQuestionsAnswered = sessions.reduce(
      (sum, s) => sum + s.responses.length,
      0
    );

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      inProgressSessions: sessions.filter(
        s => s.status === AiInterviewSessionStatus.IN_PROGRESS ||
             s.status === AiInterviewSessionStatus.STARTED
      ).length,
      averageScore: Math.round(averageScore),
      totalQuestionsAnswered,
    };
  } catch (error) {
    this.logger.error(`Failed to fetch stats for user ${userId}:`, error);
    throw new InternalServerErrorException('Failed to fetch session statistics');
  }
}}
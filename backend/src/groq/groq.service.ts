// src/groq/groq.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatCompletionOptions {
  messages: GroqMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly groq: Groq;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not defined in environment variables');
    }

    this.groq = new Groq({ apiKey });
    this.model = this.configService.get<string>('GROQ_MODEL', 'llama-3.1-70b-versatile');
    
    this.logger.log(`Groq service initialized with model: ${this.model}`);
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(options: GroqChatCompletionOptions): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: options.messages,
        model: this.model,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        response_format: options.responseFormat,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in Groq response');
      }

      return content;
    } catch (error) {
      this.logger.error(`Groq API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a JSON-formatted chat completion
   */
  async createJsonCompletion<T>(options: GroqChatCompletionOptions): Promise<T> {
    const content = await this.createChatCompletion({
      ...options,
      responseFormat: { type: 'json_object' },
    });

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.error(`Failed to parse JSON response: ${content}`);
      throw new Error('Invalid JSON response from Groq');
    }
  }

  /**
   * Stream chat completion (for future use)
   */
  async *streamChatCompletion(options: GroqChatCompletionOptions): AsyncGenerator<string> {
    const stream = await this.groq.chat.completions.create({
      messages: options.messages,
      model: this.model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
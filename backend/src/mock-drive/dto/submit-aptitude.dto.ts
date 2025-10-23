import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AptitudeAnswerDto {
  @ApiProperty({
    description: 'Question ID (cuid string from MockDriveAptitudeQuestion)',
    example: 'clx1234567890abcdefg',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string; // Changed from number to string

  @ApiProperty({
    description: 'Selected answer option',
    example: 'A',
    enum: ['A', 'B', 'C', 'D'],
  })
  @IsString()
  @IsNotEmpty()
  selectedAnswer: string;
}

export class SubmitAptitudeDto {
  @ApiProperty({
    description: 'Array of answers for all questions',
    type: [AptitudeAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AptitudeAnswerDto)
  answers: AptitudeAnswerDto[];

  @ApiProperty({
    description: 'Time taken to complete the test in seconds',
    example: 1800,
    required: false,
  })
  timeTakenSeconds?: number;
}
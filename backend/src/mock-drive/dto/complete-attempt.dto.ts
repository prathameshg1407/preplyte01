import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteAttemptDto {
  @ApiPropertyOptional({
    description: 'Additional notes or feedback from student',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
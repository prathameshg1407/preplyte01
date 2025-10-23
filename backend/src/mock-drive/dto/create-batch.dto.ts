import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ 
    example: 'Batch A',
    description: 'Name of the batch' 
  })
  @IsString()
  @IsNotEmpty()
  batchName: string;

  @ApiProperty({ 
    example: '2024-03-15T10:00:00Z',
    description: 'Batch start time (ISO 8601 format)' 
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ 
    example: '2024-03-15T14:00:00Z',
    description: 'Batch end time (ISO 8601 format)' 
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ 
    example: 50,
    description: 'Maximum number of students allowed in this batch',
    minimum: 1 
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxStudents?: number;
}
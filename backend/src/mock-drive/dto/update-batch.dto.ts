import { PartialType } from '@nestjs/swagger';
import { CreateBatchDto } from './create-batch.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether the batch is active or not' 
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
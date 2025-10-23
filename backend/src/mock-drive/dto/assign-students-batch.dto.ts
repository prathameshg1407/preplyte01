import { IsArray, IsString, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignStudentsToBatchDto {
  @ApiProperty({
    type: [String],
    example: ['user-id-1', 'user-id-2'],
    description: 'Array of user IDs to assign to batch',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  studentIds: string[];
}

export class RemoveStudentFromBatchDto {
  @ApiProperty({ example: 'user-id-1' })
  @IsString()
  @IsNotEmpty()
  studentId: string;
}
import { IsNotEmpty, IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Defines the validation rules for the data sent when submitting code for evaluation.
 */
export class SubmitCodeDto {
  @ApiProperty({
    description: 'The ID of the programming language used (e.g., from Judge0).',
    example: 93, // JavaScript
  })
  @IsNotEmpty()
  @IsInt()
 language_id: number;

  @ApiProperty({
    description: 'The user-written source code, Base64 encoded.',
    example: 'Y29uc29sZS5sb2coImhlbGxvLCB3b3JsZCIpOw==',
  })
  @IsNotEmpty()
  @IsString()
source_code: string;

  @ApiPropertyOptional({
    description: 'Standard input for the code, Base64 encoded.',
  })
  @IsOptional()
  @IsString()
   stdin?: string;

  @ApiProperty({
    description: 'The ID of the machine test this submission belongs to.',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
   machineTestId: number;
}

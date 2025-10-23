// dto/transfer-user.dto.ts
import { IsInt, Min } from 'class-validator';

export class TransferUserDto {
  @IsInt()
  @Min(1)
  institutionId: number;
}
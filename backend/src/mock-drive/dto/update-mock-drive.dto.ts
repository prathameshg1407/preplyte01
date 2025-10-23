import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMockDriveDto } from './create-mock-drive.dto';

export class UpdateMockDriveDto extends PartialType(
  OmitType(CreateMockDriveDto, [] as const),
) {}
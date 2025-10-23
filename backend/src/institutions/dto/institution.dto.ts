import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsFQDN,
} from 'class-validator';

/**
 * Defines the data structure and validation rules for creating a new institution.
 */
export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsFQDN(
    {},
    {
      message:
        'Domain must be a valid fully-qualified domain name (e.g., example.com).',
    },
  )
  @IsNotEmpty()
  domain: string;

  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL.' })
  logoUrl?: string;
}

/**
 * Defines the data structure and validation rules for updating an existing institution.
 * All fields are optional, allowing for partial updates.
 */
export class UpdateInstitutionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsFQDN(
    {},
    {
      message:
        'Domain must be a valid fully-qualified domain name (e.g., example.com).',
    },
  )
  domain?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL.' })
  logoUrl?: string;
}

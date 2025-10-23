import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  ForbiddenException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
} from './dto/institution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
// --- UPDATE: Using the standardized decorator and interface ---
import { GetUser } from '../auth/decorators/user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

/**
 * Controller for managing institutions. Access is protected by JWT and role-based guards.
 */
@Controller('institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  /**
   * Creates a new institution.
   * @route POST /institutions
   * @roles SUPER_ADMIN
   * @param createInstitutionDto - The data for the new institution.
   * @returns The newly created institution object.
   */
  @Post()
  @Roles(Role.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return this.institutionsService.create(createInstitutionDto);
  }

  /**
   * Retrieves a paginated and searchable list of all institutions.
   * @route GET /institutions
   * @roles SUPER_ADMIN
   * @param skip - Number of records to skip for pagination.
   * @param take - Number of records to take for pagination.
   * @param search - A search term to filter institutions by name or domain.
   * @returns A list of institutions and the total count.
   */
  @Get()
  @Roles(Role.SUPER_ADMIN)
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.institutionsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
    });
  }

  /**
   * Retrieves detailed information for a single institution, including user lists.
   * @route GET /institutions/:id/details
   * @roles SUPER_ADMIN, INSTITUTION_ADMIN
   * @param id - The ID of the institution to retrieve.
   * @param user - The JWT payload of the authenticated user.
   * @returns The detailed institution object.
   */
  @Get(':id/details')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  async findOneWithDetails(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    // Authorization: Institution admins can only view their own institution.
    if (user.role === Role.INSTITUTION_ADMIN && user.institutionId !== id) {
      throw new ForbiddenException(
        'You are not authorized to view this institution.',
      );
    }
    return this.institutionsService.findOneWithDetails(id);
  }

  /**
   * Retrieves basic information for a single institution.
   * @route GET /institutions/:id
   * @roles SUPER_ADMIN, INSTITUTION_ADMIN
   * @param id - The ID of the institution to retrieve.
   * @param user - The JWT payload of the authenticated user.
   * @returns The institution object.
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    // Authorization: Institution admins can only view their own institution.
    if (user.role === Role.INSTITUTION_ADMIN && user.institutionId !== id) {
      throw new ForbiddenException(
        'You are not authorized to view this institution.',
      );
    }
    return this.institutionsService.findOne(id);
  }

  /**
   * Updates an existing institution.
   * @route PATCH /institutions/:id
   * @roles SUPER_ADMIN
   * @param id - The ID of the institution to update.
   * @param updateInstitutionDto - The data to update.
   * @returns The updated institution object.
   */
  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
  ) {
    return this.institutionsService.update(id, updateInstitutionDto);
  }

  /**
   * Deletes an institution.
   * @route DELETE /institutions/:id
   * @roles SUPER_ADMIN
   * @param id - The ID of the institution to delete.
   * @returns The deleted institution object.
   */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.institutionsService.remove(id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Institution, Role } from '@prisma/client';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new institution.
   * @param data - The data for the new institution.
   * @returns The newly created institution object.
   */
  async create(data: Prisma.InstitutionCreateInput): Promise<Institution> {
    return this.prisma.institution.create({ data });
  }

  /**
   * Retrieves a paginated and searchable list of all institutions.
   * @param params - Options for pagination (skip, take) and searching.
   * @returns An object containing the list of institutions and the total count.
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const { skip, take, search } = params;
    const where: Prisma.InstitutionWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { domain: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [institutions, total] = await this.prisma.$transaction([
      this.prisma.institution.findMany({
        skip,
        take,
        where,
        orderBy: { name: 'asc' },
        include: { _count: { select: { users: true } } },
      }),
      this.prisma.institution.count({ where }),
    ]);
    return { institutions, total };
  }

  /**
   * Finds a single institution by its ID.
   * @param id - The ID of the institution to find.
   * @returns The institution object.
   * @throws {NotFoundException} If the institution is not found.
   */
  async findOne(id: number): Promise<Institution> {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });
    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found.`);
    }
    return institution;
  }

  /**
   * Finds a single institution with detailed counts and categorized user lists.
   * @param id - The ID of the institution to find.
   * @returns A detailed institution object with separate lists of admins and students.
   * @throws {NotFoundException} If the institution is not found.
   *
   * NOTE: mockDrive-related metrics were removed per request.
   */
  async findOneWithDetails(id: number) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        // Only keep counts that are still relevant (users).
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          include: {
            profile: true,
            _count: {
              // Keep machineTestSubmissions (formerly codingSubmissions) if you still use it.
              select: {
                machineTestSubmissions: true,
              },
            },
          },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found.`);
    }

    // Separate users into admins and students for easier consumption on the frontend.
    const admins = institution.users.filter(
      (user) => user.role === Role.INSTITUTION_ADMIN,
    );
    const students = institution.users.filter(
      (user) => user.role === Role.STUDENT,
    );

    // Return institution data without the full users array, but with admins/students separated.
    const { users, ...institutionData } = institution;
    return { ...institutionData, admins, students };
  }

  /**
   * Updates an existing institution's data.
   * @param id - The ID of the institution to update.
   * @param data - The data to update.
   * @returns The updated institution object.
   */
  async update(
    id: number,
    data: Prisma.InstitutionUpdateInput,
  ): Promise<Institution> {
    await this.findOne(id); // Ensures the institution exists before updating
    return this.prisma.institution.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes an institution from the database.
   * @param id - The ID of the institution to delete.
   * @returns The deleted institution object.
   */
  async remove(id: number): Promise<Institution> {
    await this.findOne(id); // Ensures the institution exists before deleting
    return this.prisma.institution.delete({
      where: { id },
    });
  }
}

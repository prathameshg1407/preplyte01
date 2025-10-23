import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  UserStatus,
  Prisma,
  Profile,
  Resume,
  ResumeAnalysisStatus,
  TagCategory,
} from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadResumeDto } from './dto/upload-resume.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  requiredFields: string[];
  completedFields: string[];
  suggestions: string[];
}

export interface ProfileWithSkills extends Profile {
  skills: Array<{
    id: number;
    name: string;
    category: string;
  }>;
}

export interface ResumeWithAnalysis extends Resume {
  analysis?: {
    atsScore: number;
    formatScore: number;
    keywordsFound: string[];
    suggestions: string[];
  } | null;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly maxResumeSize: number;
  private readonly maxResumesPerUser: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.maxResumeSize = this.configService.get<number>('MAX_RESUME_SIZE', 5242880); // 5MB
    this.maxResumesPerUser = this.configService.get<number>('MAX_RESUMES_PER_USER', 5);
  }

  /**
   * Gets user profile with skills
   */
  async getProfile(userId: string): Promise<ProfileWithSkills | null> {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
        include: {
          skills: {
            select: {
              id: true,
              name: true,
              category: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
      });

      return profile as ProfileWithSkills | null;
    } catch (error) {
      this.logger.error(`Error fetching profile for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch profile');
    }
  }

  /**
   * Updates user profile with optimized transaction handling
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileWithSkills> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const { skills, ...profileData } = updateProfileDto;

    // Validate required fields for new profile
    if (!user.profile && (!profileData.fullName || !profileData.graduationYear)) {
      throw new BadRequestException(
        'Full name and graduation year are required to create a profile'
      );
    }

    // Validate graduation year
    if (profileData.graduationYear) {
      const currentYear = new Date().getFullYear();
      if (
        profileData.graduationYear < currentYear - 10 ||
        profileData.graduationYear > currentYear + 10
      ) {
        throw new BadRequestException('Invalid graduation year');
      }
    }

    try {
      // Use transaction for atomic updates
      await this.prisma.$transaction(
        async (tx) => {
          // Upsert profile
          const profile = await tx.profile.upsert({
            where: { userId },
            update: profileData,
            create: {
              userId,
              fullName: profileData.fullName!,
              graduationYear: profileData.graduationYear!,
              ...profileData,
            },
          });

          // Calculate average CGPA if semester CGPAs are provided
          const averageCgpa = this.calculateAverageCgpa(profile);
          if (averageCgpa !== null) {
            await tx.profile.update({
              where: { userId },
              data: { averageCgpa },
            });
          }

          // Handle skills if provided
          if (skills && skills.length > 0) {
            // Create tags if they don't exist
            const skillTags = await Promise.all(
              skills.map((skillName) =>
                tx.tag.upsert({
                  where: {
                    name_category: {
                      name: skillName,
                      category: TagCategory.SKILL,
                    },
                  },
                  update: {},
                  create: {
                    name: skillName,
                    category: TagCategory.SKILL,
                  },
                })
              )
            );

            // Update profile skills
            await tx.profile.update({
              where: { userId },
              data: {
                skills: {
                  set: skillTags.map((tag) => ({ id: tag.id })),
                },
              },
            });
          }

          // Update user status if needed
          if (user.status === UserStatus.PENDING_PROFILE_COMPLETION) {
            await tx.user.update({
              where: { id: userId },
              data: { status: UserStatus.ACTIVE },
            });
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        }
      );

      return this.getProfile(userId) as Promise<ProfileWithSkills>;
    } catch (error) {
      this.logger.error(`Error updating profile for user ${userId}: ${error.message}`);
      if (error.code === 'P2002') {
        throw new ConflictException('Profile update conflict');
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /**
   * Calculates average CGPA from semester CGPAs
   */
  private calculateAverageCgpa(profile: Profile): Decimal | null {
    const cgpaFields = [
      profile.degreeSem1Cgpa,
      profile.degreeSem2Cgpa,
      profile.degreeSem3Cgpa,
      profile.degreeSem4Cgpa,
      profile.degreeSem5Cgpa,
      profile.degreeSem6Cgpa,
      profile.degreeSem7Cgpa,
      profile.degreeSem8Cgpa,
    ];

    const validCgpas = cgpaFields.filter(
      (cgpa): cgpa is Decimal => cgpa !== null && cgpa !== undefined
    );

    if (validCgpas.length === 0) {
      return null;
    }

    const sum = validCgpas.reduce((acc, val) => acc.plus(val), new Decimal(0));
    return sum.dividedBy(validCgpas.length);
  }

  /**
   * Updates profile picture with validation
   */
  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5242880) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    try {
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        `placementprep/avatars/${userId}`
      );

      await this.updateProfile(userId, {
        profileImageUrl: uploadResult.secure_url,
      });

      this.logger.log(`Profile picture updated for user ${userId}`);

      return {
        message: 'Profile picture updated successfully',
        imageUrl: uploadResult.secure_url,
      };
    } catch (error) {
      this.logger.error(`Error uploading profile picture for ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload profile picture');
    }
  }

  /**
   * Adds a new resume with validation
   */
  async addResume(
    userId: string,
    file: Express.Multer.File,
    uploadResumeDto?: UploadResumeDto,
  ): Promise<Resume> {
    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and Word documents are allowed');
    }

    // Validate file size
    if (file.size > this.maxResumeSize) {
      throw new BadRequestException(
        `File size must be less than ${this.maxResumeSize / 1048576}MB`
      );
    }

    // Check resume limit
    const resumeCount = await this.prisma.resume.count({
      where: { userId },
    });

    if (resumeCount >= this.maxResumesPerUser) {
      throw new BadRequestException(
        `You can only have up to ${this.maxResumesPerUser} resumes`
      );
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        `placementprep/resumes/${userId}`
      );

      // Create resume in transaction
      const resume = await this.prisma.$transaction(async (tx) => {
        // Handle primary resume logic
        const isPrimary = uploadResumeDto?.isPrimary ?? resumeCount === 0;
        
        if (isPrimary) {
          await tx.resume.updateMany({
            where: { userId, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        // Create new resume
        return tx.resume.create({
          data: {
            userId,
            title: uploadResumeDto?.title || file.originalname.replace(/\.[^/.]+$/, ''),
            filename: file.originalname,
            storagePath: uploadResult.secure_url,
            isPrimary,
            analysisStatus: ResumeAnalysisStatus.PENDING,
          },
        });
      });

      this.logger.log(`Resume uploaded for user ${userId}: ${resume.id}`);
      
      // TODO: Trigger resume analysis job here
      // this.resumeAnalysisQueue.add('analyze', { resumeId: resume.id });

      return resume;
    } catch (error) {
      this.logger.error(`Error uploading resume for ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload resume');
    }
  }

  /**
   * Gets all resumes for a user
   */
  async getResumes(userId: string): Promise<ResumeWithAnalysis[]> {
    try {
      const resumes = await this.prisma.resume.findMany({
        where: { userId },
        include: {
          analysis: {
            select: {
              atsScore: true,
              formatScore: true,
              keywordsFound: true,
              suggestions: true,
            },
          },
        },
        orderBy: [
          { isPrimary: 'desc' },
          { uploadedAt: 'desc' }, // Fixed: Changed from createdAt to uploadedAt
        ],
      });

      return resumes.map(resume => ({
        ...resume,
        analysis: resume.analysis ? {
          atsScore: resume.analysis.atsScore.toNumber(),
          formatScore: resume.analysis.formatScore.toNumber(),
          keywordsFound: resume.analysis.keywordsFound,
          suggestions: resume.analysis.suggestions,
        } : null, // Changed from undefined to null for consistency
      }));
    } catch (error) {
      this.logger.error(`Error fetching resumes for ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch resumes');
    }
  }

  /**
   * Gets resume file content
   */
  async getResumeFile(
    userId: string,
    resumeId: number,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found or access denied');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(resume.storagePath, {
          responseType: 'arraybuffer',
          timeout: 10000,
        })
      );

      const contentType = response.headers['content-type'] || 'application/pdf';

      return {
        buffer: Buffer.from(response.data),
        contentType,
        filename: resume.filename || resume.title || 'resume.pdf',
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch resume file from storage: ${error.message}`
      );
      throw new InternalServerErrorException('Failed to retrieve resume file');
    }
  }

  /**
   * Sets a resume as primary
   */
  async setPrimaryResume(userId: string, resumeId: number): Promise<Resume> {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found or access denied');
    }

    if (resume.isPrimary) {
      return resume;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Unset current primary
        await tx.resume.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });

        // Set new primary
        return tx.resume.update({
          where: { id: resumeId },
          data: { isPrimary: true },
        });
      });
    } catch (error) {
      this.logger.error(`Error setting primary resume: ${error.message}`);
      throw new InternalServerErrorException('Failed to update primary resume');
    }
  }

  /**
   * Deletes a resume
   */
  async deleteResume(userId: string, resumeId: number): Promise<Resume> {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found or access denied');
    }

    try {
      // Delete from Cloudinary (non-blocking)
      this.deleteFromCloudinary(resume.storagePath).catch(error => {
        this.logger.warn(`Failed to delete resume from Cloudinary: ${error.message}`);
      });

      // Delete from database
      const deletedResume = await this.prisma.resume.delete({
        where: { id: resumeId },
      });

      // If deleted resume was primary, set another as primary
      if (deletedResume.isPrimary) {
        const nextResume = await this.prisma.resume.findFirst({
          where: { userId },
          orderBy: { uploadedAt: 'desc' }, // Fixed: Changed from createdAt to uploadedAt
        });

        if (nextResume) {
          await this.prisma.resume.update({
            where: { id: nextResume.id },
            data: { isPrimary: true },
          });
        }
      }

      this.logger.log(`Resume ${resumeId} deleted for user ${userId}`);
      return deletedResume;
    } catch (error) {
      this.logger.error(`Error deleting resume: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete resume');
    }
  }

  /**
   * Helper to delete file from Cloudinary
   */
  private async deleteFromCloudinary(storagePath: string): Promise<void> {
    const publicIdMatch = storagePath.match(/placementprep\/resumes\/.+/);
    if (publicIdMatch) {
      const publicIdWithExtension = publicIdMatch[0];
      const publicId = publicIdWithExtension.substring(
        0,
        publicIdWithExtension.lastIndexOf('.')
      );
      await this.cloudinaryService.deleteFile(publicId);
    }
  }

  /**
   * Gets comprehensive profile completion status
   */
  async getProfileCompletionStatus(userId: string): Promise<ProfileCompletionStatus> {
    const profile = await this.getProfile(userId);
    const resumeCount = await this.prisma.resume.count({ where: { userId } });

    const requiredFields = ['fullName', 'graduationYear'];
    const recommendedFields = [
      'profileImageUrl',
      'linkedinUrl',
      'githubUrl',
      'sscPercentage',
      'hscPercentage',
      'averageCgpa',
      'skills',
      'resume',
    ];

    const allFields = [...requiredFields, ...recommendedFields];
    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    if (!profile) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: allFields,
        requiredFields,
        completedFields: [],
        suggestions: [
          'Complete your profile to get started',
          'Add your full name and graduation year',
        ],
      };
    }

    // Check each field
    allFields.forEach((field) => {
      let isCompleted = false;

      switch (field) {
        case 'skills':
          isCompleted = profile.skills && profile.skills.length > 0;
          if (!isCompleted) {
            suggestions.push('Add your technical skills to improve visibility');
          }
          break;
        case 'resume':
          isCompleted = resumeCount > 0;
          if (!isCompleted) {
            suggestions.push('Upload your resume to apply for opportunities');
          }
          break;
        case 'linkedinUrl':
          isCompleted = !!profile.linkedinUrl;
          if (!isCompleted) {
            suggestions.push('Add your LinkedIn profile for better networking');
          }
          break;
        case 'averageCgpa':
          isCompleted = !!profile.averageCgpa;
          if (!isCompleted) {
            suggestions.push('Add your academic scores to meet eligibility criteria');
          }
          break;
        default:
          isCompleted = !!(profile as any)[field];
      }

      if (isCompleted) {
        completedFields.push(field);
      } else {
        missingFields.push(field);
      }
    });

    const completionPercentage = Math.round(
      (completedFields.length / allFields.length) * 100
    );

    const isComplete = requiredFields.every((field) =>
      completedFields.includes(field)
    );

    // Add personalized suggestions
    if (completionPercentage < 50) {
      suggestions.unshift('Your profile is less than 50% complete');
    } else if (completionPercentage < 80) {
      suggestions.unshift('Complete your profile to unlock all features');
    } else if (completionPercentage < 100) {
      suggestions.unshift('Almost there! Add the remaining details');
    }

    return {
      isComplete,
      completionPercentage,
      missingFields,
      requiredFields,
      completedFields,
      suggestions,
    };
  }
}
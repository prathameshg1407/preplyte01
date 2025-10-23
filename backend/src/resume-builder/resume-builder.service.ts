import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { SaveResumeDataDto, UpdateResumeDataDto, GenerateResumeDto } from './dto/resume-builder.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import pdfParse from 'pdf-parse';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ResumeBuilderService {
  private readonly logger = new Logger(ResumeBuilderService.name, { timestamp: true });

  constructor(private readonly prisma: PrismaService) {}

  // ===================================================================================
  // Resume Data Management
  // ===================================================================================

  async saveResumeData(userId: string, data: SaveResumeDataDto) {
    this.logger.log(`Saving resume data for user: ${userId}`);

    try {
      const resume = await this.prisma.resume.create({
        data: {
          userId,
          title: data.title,
          content: JSON.stringify({
            profileData: data.profileData,
            template: data.template || 'modern',
            customSettings: data.customSettings || {},
          }),
          storagePath: `resumes/${userId}/${Date.now()}-${data.title}.json`,
          analysisStatus: 'PENDING',
          isPrimary: false,
        },
      });

      this.logger.log(`Resume created successfully with ID: ${resume.id}`);

      return {
        id: resume.id,
        title: resume.title,
        message: 'Resume saved successfully',
        uploadedAt: resume.uploadedAt, // Changed from createdAt to uploadedAt
      };
    } catch (error) {
      this.logger.error(`Error saving resume: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to save resume data');
    }
  }

  async getSavedResumes(userId: string) {
    this.logger.log(`Fetching saved resumes for user: ${userId}`);

    try {
      const resumes = await this.prisma.resume.findMany({
        where: {
          userId,
          NOT: {
            title: 'Profile Data',
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          userId: true,
          title: true,
          filename: true,
          storagePath: true,
          analysisStatus: true,
          isPrimary: true,
          uploadedAt: true, // Changed from createdAt to uploadedAt
          updatedAt: true,
          content: true, // Include content for frontend
        },
      });

      this.logger.log(`Found ${resumes.length} resumes for user ${userId}`);
      return resumes;
    } catch (error) {
      this.logger.error(`Error fetching resumes: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch resumes');
    }
  }

  async getResumeDetails(userId: string, resumeId: number) {
    this.logger.log(`Fetching resume ${resumeId} for user: ${userId}`);

    try {
      const resume = await this.prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId,
        },
      });

      if (!resume) {
        this.logger.warn(`Resume ${resumeId} not found for user ${userId}`);
        throw new NotFoundException('Resume not found');
      }

      this.logger.log(`Resume ${resumeId} retrieved successfully`);
      return resume;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching resume details: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch resume details');
    }
  }

  async updateResumeData(userId: string, resumeId: number, data: UpdateResumeDataDto) {
    this.logger.log(`Updating resume ${resumeId} for user: ${userId}`);

    try {
      // Verify ownership
      const resume = await this.getResumeDetails(userId, resumeId);

      const currentContent = resume.content ? JSON.parse(resume.content) : {};
      const updatedContent = {
        profileData: data.profileData || currentContent.profileData,
        template: data.template || currentContent.template || 'modern',
        customSettings: data.customSettings || currentContent.customSettings || {},
      };

      const updated = await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          title: data.title || resume.title,
          content: JSON.stringify(updatedContent),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Resume ${resumeId} updated successfully`);

      return {
        message: 'Resume updated successfully',
        resume: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error updating resume: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update resume');
    }
  }

  async deleteResume(userId: string, resumeId: number) {
    this.logger.log(`Deleting resume ${resumeId} for user: ${userId}`);

    try {
      // Verify ownership
      await this.getResumeDetails(userId, resumeId);

      await this.prisma.resume.delete({
        where: { id: resumeId },
      });

      this.logger.log(`Resume ${resumeId} deleted successfully`);

      return { 
        message: 'Resume deleted successfully',
        resumeId,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting resume: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete resume');
    }
  }

  // ===================================================================================
  // Resume Generation
  // ===================================================================================

  async generateResume(userId: string, options: GenerateResumeDto): Promise<Buffer> {
    this.logger.log(`Generating resume for user: ${userId}, template: ${options.template}`);

    if (!options.profileData || !options.profileData.fullName || !options.profileData.email) {
      throw new BadRequestException('Profile data is incomplete. Full name and email are required.');
    }

    try {
      return await this.generateResumePDF(options.profileData, options);
    } catch (error) {
      this.logger.error(`Error generating resume: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate resume PDF');
    }
  }

  async generateResumeFromData(profileData: any, template: string, customSettings?: any): Promise<Buffer> {
    this.logger.log(`Generating resume from data with template: ${template}`);

    if (!profileData || !profileData.fullName || !profileData.email) {
      throw new BadRequestException('Profile data is incomplete');
    }

    try {
      return await this.generateResumePDF(profileData, {
        template,
        profileData,
        primaryColor: customSettings?.primaryColor,
        fontFamily: customSettings?.fontFamily,
        sectionsOrder: customSettings?.sectionsOrder,
        hiddenSections: customSettings?.hiddenSections,
        customization: customSettings,
      });
    } catch (error) {
      this.logger.error(`Error generating resume from data: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate resume');
    }
  }

  private async generateResumePDF(profileData: any, options: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          this.logger.log('PDF generation completed');
          resolve(Buffer.concat(buffers));
        });
        doc.on('error', (error) => {
          this.logger.error(`PDF generation error: ${error.message}`);
          reject(error);
        });

        // Apply custom font if specified
        if (options.fontFamily && options.fontFamily !== 'Helvetica') {
          // Note: PDFKit supports limited fonts. You may need to register custom fonts.
          // For now, we'll use the default fonts
        }

        // Apply template styles
        this.applyTemplateStyles(doc, options.template, profileData, options.primaryColor);

        // Add sections
        const sectionsOrder = options.sectionsOrder || [
          'summary',
          'experience',
          'education',
          'skills',
          'projects',
          'certifications',
          'languages',
          'achievements',
        ];

        sectionsOrder.forEach(section => {
          if (options.hiddenSections?.includes(section)) return;

          switch (section) {
            case 'summary':
              if (profileData.summary) {
                this.addSection(doc, 'PROFESSIONAL SUMMARY', () => {
                  doc.text(profileData.summary, { align: 'justify' });
                });
              }
              break;

            case 'experience':
              if (profileData.experience?.length) {
                this.addSection(doc, 'WORK EXPERIENCE', () => {
                  profileData.experience.forEach((exp, index) => {
                    doc.font('Helvetica-Bold')
                      .text(`${exp.role} at ${exp.company}`)
                      .font('Helvetica')
                      .fontSize(9)
                      .text(`${exp.startDate} - ${exp.endDate || 'Present'}`)
                      .fontSize(10);

                    if (exp.location) {
                      doc.fontSize(9).text(exp.location).fontSize(10);
                    }

                    if (exp.responsibilities?.length) {
                      exp.responsibilities.forEach(resp => {
                        doc.text(`• ${resp}`, { indent: 20 });
                      });
                    }
                    
                    if (index < profileData.experience.length - 1) {
                      doc.moveDown(0.5);
                    }
                  });
                });
              }
              break;

            case 'education':
              if (profileData.education?.length) {
                this.addSection(doc, 'EDUCATION', () => {
                  profileData.education.forEach((edu, index) => {
                    doc.font('Helvetica-Bold')
                      .text(`${edu.degree} in ${edu.field}`)
                      .font('Helvetica')
                      .text(edu.institution)
                      .fontSize(9)
                      .text(`${edu.startDate} - ${edu.endDate}`)
                      .fontSize(10);

                    if (edu.grade) {
                      doc.text(`GPA: ${edu.grade}`);
                    }
                    if (edu.description) {
                      doc.text(edu.description);
                    }
                    
                    if (index < profileData.education.length - 1) {
                      doc.moveDown(0.5);
                    }
                  });
                });
              }
              break;

            case 'skills':
              if (profileData.skills?.length) {
                this.addSection(doc, 'SKILLS', () => {
                  const skillsText = profileData.skills.join(' • ');
                  doc.text(skillsText, { align: 'justify' });
                });
              }
              break;

            case 'projects':
              if (profileData.projects?.length) {
                this.addSection(doc, 'PROJECTS', () => {
                  profileData.projects.forEach((project, index) => {
                    doc.font('Helvetica-Bold')
                      .text(project.name)
                      .font('Helvetica')
                      .text(project.description);

                    if (project.technologies?.length) {
                      doc.fontSize(9)
                        .text(`Technologies: ${project.technologies.join(', ')}`)
                        .fontSize(10);
                    }
                    if (project.link) {
                      doc.fillColor('blue')
                        .text(project.link, { link: project.link })
                        .fillColor('black');
                    }
                    
                    if (index < profileData.projects.length - 1) {
                      doc.moveDown(0.5);
                    }
                  });
                });
              }
              break;

            case 'certifications':
              if (profileData.certifications?.length) {
                this.addSection(doc, 'CERTIFICATIONS', () => {
                  profileData.certifications.forEach(cert => {
                    doc.text(`• ${cert.name} - ${cert.issuer} (${cert.date})`);
                  });
                });
              }
              break;

            case 'languages':
              if (profileData.languages?.length) {
                this.addSection(doc, 'LANGUAGES', () => {
                  doc.text(profileData.languages.join(' • '));
                });
              }
              break;

            case 'achievements':
              if (profileData.achievements?.length) {
                this.addSection(doc, 'ACHIEVEMENTS', () => {
                  profileData.achievements.forEach(achievement => {
                    doc.text(`• ${achievement}`);
                  });
                });
              }
              break;
          }
        });

        doc.end();
      } catch (error) {
        this.logger.error(`Error in PDF generation: ${error.message}`, error.stack);
        reject(error);
      }
    });
  }

  private addSection(doc: any, title: string, content: () => void) {
    doc.moveDown(0.5)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(title, { underline: true })
      .font('Helvetica')
      .fontSize(10)
      .moveDown(0.3);

    content();
    doc.moveDown(0.5);
  }

  private applyTemplateStyles(doc: any, template: string, profile: any, customColor?: string) {
    const color = customColor || profile.primaryColor || this.getTemplateColor(template);

    switch (template) {
      case 'modern':
        doc.rect(0, 0, 612, 100).fill(color);
        doc.fillColor('white')
          .fontSize(24)
          .font('Helvetica-Bold')
          .text(profile.fullName, 50, 30);
        if (profile.headline) {
          doc.fontSize(12).font('Helvetica').text(profile.headline, 50, 55);
        }
        doc.fontSize(10).text(`${profile.email} | ${profile.phone}`, 50, 75);
        if (profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) {
          const links = [profile.linkedinUrl, profile.githubUrl, profile.portfolioUrl]
            .filter(Boolean)
            .join(' | ');
          doc.fontSize(9).text(links, 50, 88);
        }
        doc.fillColor('black').moveDown(3);
        break;

      case 'minimal':
        doc.fontSize(20)
          .font('Helvetica')
          .text(profile.fullName, { align: 'center' });
        if (profile.headline) {
          doc.fontSize(11)
            .fillColor('#666')
            .text(profile.headline, { align: 'center' })
            .fillColor('black');
        }
        doc.fontSize(10)
          .text(`${profile.email} | ${profile.phone}`, { align: 'center' });
        doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();
        doc.moveDown(2);
        break;

      case 'professional':
        doc.fontSize(18)
          .font('Times-Roman')
          .text(profile.fullName, { align: 'center' });
        if (profile.headline) {
          doc.fontSize(11)
            .font('Times-Italic')
            .text(profile.headline, { align: 'center' });
        }
        doc.fontSize(10)
          .font('Times-Roman')
          .text(`${profile.email} | ${profile.phone}`, { align: 'center' });
        if (profile.address) {
          doc.text(profile.address, { align: 'center' });
        }
        doc.moveDown(2);
        break;

      case 'creative':
        doc.circle(50, 50, 30).fill(color);
        doc.fillColor('white')
          .fontSize(16)
          .text(
            profile.fullName.split(' ').map(n => n[0]).join(''),
            35,
            42
          );
        doc.fillColor(color)
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(profile.fullName, 100, 35);
        doc.fillColor('black')
          .fontSize(10)
          .font('Helvetica')
          .text(`${profile.email} | ${profile.phone}`, 100, 60);
        doc.moveDown(4);
        break;

      case 'corporate':
        doc.fontSize(20)
          .font('Helvetica-Bold')
          .text(profile.fullName.toUpperCase(), { align: 'center' });
        if (profile.headline) {
          doc.fontSize(11)
            .font('Helvetica')
            .text(profile.headline, { align: 'center' });
        }
        doc.fontSize(10)
          .text(`${profile.email} | ${profile.phone}`, { align: 'center' });
        const lineY = doc.y + 10;
        doc.moveTo(50, lineY).lineTo(550, lineY).strokeColor(color).lineWidth(2).stroke();
        doc.strokeColor('black').lineWidth(1);
        doc.moveDown(2);
        break;

      case 'elegant':
        doc.font('Helvetica')
          .fontSize(24)
          .text(profile.fullName, { align: 'center', characterSpacing: 2 });
        if (profile.headline) {
          doc.fontSize(10)
            .fillColor('#666')
            .text(profile.headline, { align: 'center' });
        }
        doc.fillColor('black')
          .fontSize(9)
          .text(`${profile.email} • ${profile.phone}`, { align: 'center' });
        doc.moveDown(2);
        break;

      default:
        doc.fontSize(16).text(profile.fullName, { align: 'center' });
        doc.fontSize(10).text(`${profile.email} | ${profile.phone}`, { align: 'center' });
        doc.moveDown();
    }
  }

  private getTemplateColor(template: string): string {
    const colors = {
      modern: '#2b6cb0',
      minimal: '#000000',
      professional: '#1a3c5e',
      creative: '#dd6b20',
      corporate: '#1a3c5e',
      elegant: '#4a5568',
    };
    return colors[template] || '#2b6cb0';
  }

  // ===================================================================================
  // ATS Check
  // ===================================================================================

  async checkAtsScore(filePath: string, jobRole: string) {
    this.logger.log(`Starting ATS score check for job role: ${jobRole}`);

    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('Resume file not found');
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new BadRequestException('Uploaded resume file is empty');
      }

      let resumeContent: string;
      try {
        const resumeBuffer = fs.readFileSync(filePath);
        const parsed = await pdfParse(resumeBuffer);
        resumeContent = parsed.text;
        if (!resumeContent.trim()) {
          throw new BadRequestException('No text could be extracted from the resume');
        }
      } catch (parseError) {
        throw new BadRequestException(`Failed to parse resume PDF: ${parseError.message}`);
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new BadRequestException('API key for ATS analysis is missing');
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      const prompt = `
        Analyze the following resume for ATS (Applicant Tracking System) compatibility for the job role: "${jobRole}".
        
        Return ONLY a valid JSON object (no markdown, no code blocks) with:
        - atsScore (number 0-100): Overall ATS compatibility score
        - keywordsFound (array of strings): Important keywords present in the resume relevant to ${jobRole}
        - keywordsMissing (array of strings): Important keywords missing for the ${jobRole} role
        - formatScore (number 0-100): Score for ATS-friendly formatting
        - suggestions (array of strings): Specific actionable suggestions for improvement
        
        Resume content:
        ${resumeContent.substring(0, 3000)}
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      this.logger.debug(`AI Response: ${response}`);

      try {
        // Clean up the response to extract JSON
        let jsonText = response.trim();
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        jsonText = jsonText.replace(/^[^{]*({.*})[^}]*$/s, '$1');
        
        const jsonResponse = JSON.parse(jsonText);
        
        const result = {
          atsScore: Number(jsonResponse.atsScore) || 0,
          keywordsFound: Array.isArray(jsonResponse.keywordsFound) ? jsonResponse.keywordsFound : [],
          keywordsMissing: Array.isArray(jsonResponse.keywordsMissing) ? jsonResponse.keywordsMissing : [],
          formatScore: Number(jsonResponse.formatScore) || 0,
          suggestions: Array.isArray(jsonResponse.suggestions) ? jsonResponse.suggestions : [],
        };

        this.logger.log(`ATS check completed with score: ${result.atsScore}`);
        return result;
      } catch (parseError) {
        this.logger.error(`Failed to parse AI response: ${parseError.message}`);
        return {
          atsScore: 0,
          keywordsFound: [],
          keywordsMissing: [],
          formatScore: 0,
          suggestions: ['Failed to parse AI response. Please try again.'],
        };
      }
    } catch (error) {
      this.logger.error(`ATS check error: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to analyze resume: ${error.message}`);
    } finally {
      // Cleanup uploaded file
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          this.logger.debug(`Cleaned up temporary file: ${filePath}`);
        } catch (unlinkError) {
          this.logger.error(`Failed to delete file: ${unlinkError.message}`);
        }
      }
    }
  }
}
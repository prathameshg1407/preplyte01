'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Plus,
  Trash2,
  Save,
  ChevronRight,
} from 'lucide-react';
import type { ResumeProfileData } from '@/types/resume-builder.types';
import { getSavedResumeDetails, updateSavedResume } from '@/lib/api/resume-builder.client';

export default function EditResumePage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = parseInt(params.id as string);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('');
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = 
    useForm<ResumeProfileData>();

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = 
    useFieldArray({ control, name: 'education' });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = 
    useFieldArray({ control, name: 'experience' });
  const { fields: projectFields, append: appendProject, remove: removeProject } = 
    useFieldArray({ control, name: 'projects' });
  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = 
    useFieldArray({ control, name: 'certifications' });

  const formData = watch();

  useEffect(() => {
    loadResumeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]); // Only run when resumeId changes

  const loadResumeData = async () => {
    try {
      const resume = await getSavedResumeDetails(resumeId);
      
      if (!resume.content) {
        toast.error('Resume not found');
        router.push('/resume-builder');
        return;
      }

      const content = JSON.parse(resume.content);
      const profileData = content.profileData || content.profile;
      
      if (!profileData) {
        toast.error('Invalid resume data');
        router.push('/resume-builder');
        return;
      }
      
      setResumeTitle(resume.title);
      reset(profileData);
      toast.success('Resume loaded successfully');
    } catch (error) {
      console.error('Error loading resume:', error);
      toast.error('Failed to load resume');
      router.push('/resume-builder');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ResumeProfileData) => {
    setIsSaving(true);
    try {
      await updateSavedResume(resumeId, {
        title: resumeTitle,
        profileData: data,
      });
      
      toast.success('Resume updated successfully');
      
      // Navigate to templates page if flag is set
      if (shouldNavigate) {
        router.push(`/resume-builder/templates/${resumeId}`);
      }
    } catch (error: any) {
      console.error('Error updating resume:', error);
      toast.error(error.message || 'Failed to update resume');
    } finally {
      setIsSaving(false);
      setShouldNavigate(false);
    }
  };

  const handleSaveAndContinue = () => {
    setShouldNavigate(true);
    handleSubmit(onSubmit)();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 max-w-md">
              <Label htmlFor="resumeTitle">Resume Title</Label>
              <Input
                id="resumeTitle"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                className="mt-1"
                placeholder="My Resume"
              />
            </div>
          </div>
          <p className="text-muted-foreground">
            Edit the information for this resume
          </p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      {...register('fullName', { required: 'Name is required' })}
                      placeholder="John Doe"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      {...register('phone', { required: 'Phone is required' })}
                      placeholder="+1234567890"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register('address')}
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="headline">Professional Headline</Label>
                  <Input
                    id="headline"
                    {...register('headline')}
                    placeholder="Full Stack Developer | React Expert"
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    {...register('summary')}
                    placeholder="Brief overview of professional background..."
                    rows={4}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      {...register('linkedinUrl')}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="githubUrl">GitHub URL</Label>
                    <Input
                      id="githubUrl"
                      {...register('githubUrl')}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                    <Input
                      id="portfolioUrl"
                      {...register('portfolioUrl')}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education */}
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      appendEducation({
                        institution: '',
                        degree: '',
                        field: '',
                        startDate: '',
                        endDate: '',
                        grade: undefined,
                        description: '',
                      });
                      toast.success('Education entry added');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Education
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {educationFields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Institution</Label>
                          <Input
                            {...register(`education.${index}.institution`)}
                            placeholder="University Name"
                          />
                        </div>
                        <div>
                          <Label>Degree</Label>
                          <Input
                            {...register(`education.${index}.degree`)}
                            placeholder="Bachelor of Science"
                          />
                        </div>
                        <div>
                          <Label>Field of Study</Label>
                          <Input
                            {...register(`education.${index}.field`)}
                            placeholder="Computer Science"
                          />
                        </div>
                        <div>
                          <Label>Grade/GPA</Label>
                          <Input
                            {...register(`education.${index}.grade`, {
                              valueAsNumber: true
                            })}
                            placeholder="3.8"
                            type="number"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            {...register(`education.${index}.startDate`)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            {...register(`education.${index}.endDate`)}
                            placeholder="MM/YYYY or Present"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>Description (Optional)</Label>
                        <Textarea
                          {...register(`education.${index}.description`)}
                          placeholder="Relevant coursework, achievements..."
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          removeEducation(index);
                          toast.info('Education entry removed');
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {educationFields.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No education entries</p>
                    <p className="text-sm text-muted-foreground">Click "Add Education" to add an entry</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience */}
          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Work Experience
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      appendExperience({
                        company: '',
                        role: '',
                        startDate: '',
                        endDate: '',
                        location: '',
                        responsibilities: [],
                      });
                      toast.success('Experience entry added');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Experience
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {experienceFields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Company</Label>
                          <Input
                            {...register(`experience.${index}.company`)}
                            placeholder="Company Name"
                          />
                        </div>
                        <div>
                          <Label>Role/Position</Label>
                          <Input
                            {...register(`experience.${index}.role`)}
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input
                            {...register(`experience.${index}.location`)}
                            placeholder="New York, NY"
                          />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            {...register(`experience.${index}.startDate`)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            {...register(`experience.${index}.endDate`)}
                            placeholder="MM/YYYY or Present"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>Key Responsibilities (one per line)</Label>
                        <Textarea
                          placeholder="Developed web applications&#10;Collaborated with team&#10;Improved performance"
                          rows={4}
                          defaultValue={field.responsibilities?.join('\n') || ''}
                          onChange={(e) => {
                            const responsibilities = e.target.value
                              .split('\n')
                              .map(s => s.trim())
                              .filter(Boolean);
                            setValue(`experience.${index}.responsibilities`, responsibilities);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          removeExperience(index);
                          toast.info('Experience entry removed');
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {experienceFields.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No experience entries</p>
                    <p className="text-sm text-muted-foreground">Click "Add Experience" to add an entry</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Skills & Languages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Textarea
                    id="skills"
                    placeholder="JavaScript, React, Node.js, Python, SQL, Git..."
                    rows={4}
                    defaultValue={formData?.skills?.join(', ') || ''}
                    onChange={(e) => {
                      const skills = e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                      setValue('skills', skills);
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter skills separated by commas
                  </p>
                </div>

                <div>
                  <Label htmlFor="languages">Languages (comma-separated)</Label>
                  <Input
                    id="languages"
                    placeholder="English (Fluent), Spanish (Intermediate)..."
                    defaultValue={formData?.languages?.join(', ') || ''}
                    onChange={(e) => {
                      const languages = e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                      setValue('languages', languages);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Projects
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      appendProject({
                        name: '',
                        description: '',
                        link: '',
                        technologies: [],
                        duration: '',
                      });
                      toast.success('Project entry added');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Project
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectFields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Project Name</Label>
                          <Input
                            {...register(`projects.${index}.name`)}
                            placeholder="E-commerce Platform"
                          />
                        </div>
                        <div>
                          <Label>Project Link</Label>
                          <Input
                            {...register(`projects.${index}.link`)}
                            placeholder="https://github.com/..."
                          />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input
                            {...register(`projects.${index}.duration`)}
                            placeholder="3 months"
                          />
                        </div>
                        <div>
                          <Label>Technologies Used (comma-separated)</Label>
                          <Input
                            placeholder="React, Node.js, MongoDB"
                            defaultValue={field.technologies?.join(', ') || ''}
                            onChange={(e) => {
                              const techs = e.target.value
                                .split(',')
                                .map(s => s.trim())
                                .filter(Boolean);
                              setValue(`projects.${index}.technologies`, techs);
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>Description</Label>
                        <Textarea
                          {...register(`projects.${index}.description`)}
                          placeholder="Describe the project, role, and achievements..."
                          rows={3}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          removeProject(index);
                          toast.info('Project entry removed');
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {projectFields.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No projects yet</p>
                    <p className="text-sm text-muted-foreground">Click "Add Project" to add a project</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional */}
          <TabsContent value="additional">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications & Achievements
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      appendCertification({
                        name: '',
                        issuer: '',
                        date: '',
                        verificationUrl: '',
                      });
                      toast.success('Certification entry added');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Certification
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {certificationFields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Certification Name</Label>
                          <Input
                            {...register(`certifications.${index}.name`)}
                            placeholder="AWS Certified Developer"
                          />
                        </div>
                        <div>
                          <Label>Issuing Organization</Label>
                          <Input
                            {...register(`certifications.${index}.issuer`)}
                            placeholder="Amazon Web Services"
                          />
                        </div>
                        <div>
                          <Label>Date Obtained</Label>
                          <Input
                            {...register(`certifications.${index}.date`)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <Label>Verification URL</Label>
                          <Input
                            {...register(`certifications.${index}.verificationUrl`)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          removeCertification(index);
                          toast.info('Certification entry removed');
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                <Separator />

                <div>
                  <Label htmlFor="achievements">Achievements & Awards</Label>
                  <Textarea
                    id="achievements"
                    placeholder="Dean's List 2022&#10;Hackathon Winner 2023&#10;Published research paper"
                    rows={4}
                    defaultValue={formData?.achievements?.join('\n') || ''}
                    onChange={(e) => {
                      const achievements = e.target.value
                        .split('\n')
                        .map(s => s.trim())
                        .filter(Boolean);
                      setValue('achievements', achievements);
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter each achievement on a new line
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4 mt-8 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/resume-builder')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save & Choose Template'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
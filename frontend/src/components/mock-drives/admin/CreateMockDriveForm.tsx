'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createMockDrive } from '@/lib/api/mock-drive.client';
import { QuestionDifficulty } from '@/types/mock-drive.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {  CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Form Schema
const formSchema = z.object({
  // Basic Info
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  eligibleYear: z.array(z.number()).min(1, 'Select at least one year'),
  
  // Eligibility Criteria
  minCgpa: z.number().min(0).max(10).optional(),
  minSscPercentage: z.number().min(0).max(100).optional(),
  minHscPercentage: z.number().min(0).max(100).optional(),
  requiredSkills: z.string().optional(),
  
  // Dates
  registrationStartDate: z.date(),
  registrationEndDate: z.date(),
  driveStartDate: z.date(),
  driveEndDate: z.date(),
  
  // Test Configuration Flags
  hasAptitude: z.boolean(),
  hasMachineTest: z.boolean(),
  hasAiInterview: z.boolean(),
  
  // Aptitude Config
  aptitudeTotalQuestions: z.number().min(1).optional(),
  aptitudeDuration: z.number().min(1).optional(),
  aptitudeEasyCount: z.number().min(0).optional(),
  aptitudeMediumCount: z.number().min(0).optional(),
  aptitudeHardCount: z.number().min(0).optional(),
  
  // Machine Test Config
  machineTestTotalProblems: z.number().min(1).optional(),
  machineTestDuration: z.number().min(1).optional(),
  machineTestEasyCount: z.number().min(0).optional(),
  machineTestEasyPoints: z.number().min(0).optional(),
  machineTestMediumCount: z.number().min(0).optional(),
  machineTestMediumPoints: z.number().min(0).optional(),
  machineTestHardCount: z.number().min(0).optional(),
  machineTestHardPoints: z.number().min(0).optional(),
  
  // AI Interview Config
  aiInterviewJobTitle: z.string().optional(),
  aiInterviewCompanyName: z.string().optional(),
  aiInterviewTotalQuestions: z.number().min(5).max(20).optional(),
  aiInterviewDuration: z.number().min(15).max(60).optional(),
  aiInterviewRequireResume: z.boolean().optional(),
  
  // Publish
  isPublished: z.boolean().optional(),
}).refine(
  (data) => {
    // At least one test must be selected
    return data.hasAptitude || data.hasMachineTest || data.hasAiInterview;
  },
  {
    message: 'At least one test type must be selected',
    path: ['hasAptitude'],
  }
).refine(
  (data) => {
    // Registration end must be after start
    return data.registrationEndDate > data.registrationStartDate;
  },
  {
    message: 'Registration end date must be after start date',
    path: ['registrationEndDate'],
  }
).refine(
  (data) => {
    // Drive start must be after registration end
    return data.driveStartDate > data.registrationEndDate;
  },
  {
    message: 'Drive start date must be after registration end date',
    path: ['driveStartDate'],
  }
).refine(
  (data) => {
    // Drive end must be after drive start
    return data.driveEndDate > data.driveStartDate;
  },
  {
    message: 'Drive end date must be after start date',
    path: ['driveEndDate'],
  }
);

type FormValues = z.infer<typeof formSchema>;

export default function CreateMockDriveForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      eligibleYear: [],
      hasAptitude: false,
      hasMachineTest: false,
      hasAiInterview: false,
      isPublished: false,
      aiInterviewRequireResume: true,
      aptitudeEasyCount: 0,
      aptitudeMediumCount: 0,
      aptitudeHardCount: 0,
      machineTestEasyCount: 0,
      machineTestMediumCount: 0,
      machineTestHardCount: 0,
    },
  });

  const hasAptitude = form.watch('hasAptitude');
  const hasMachineTest = form.watch('hasMachineTest');
  const hasAiInterview = form.watch('hasAiInterview');

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Calculate total duration
      let totalDuration = 0;
      if (values.hasAptitude && values.aptitudeDuration) {
        totalDuration += values.aptitudeDuration;
      }
      if (values.hasMachineTest && values.machineTestDuration) {
        totalDuration += values.machineTestDuration;
      }
      if (values.hasAiInterview && values.aiInterviewDuration) {
        totalDuration += values.aiInterviewDuration;
      }

      // Build DTO
      const dto: any = {
        title: values.title,
        description: values.description,
        eligibleYear: values.eligibleYear,
        eligibilityCriteria: {},
        registrationStartDate: values.registrationStartDate.toISOString(),
        registrationEndDate: values.registrationEndDate.toISOString(),
        driveStartDate: values.driveStartDate.toISOString(),
        driveEndDate: values.driveEndDate.toISOString(),
        duration: totalDuration,
        isPublished: values.isPublished || false,
      };

      // Add eligibility criteria
      if (values.minCgpa) dto.eligibilityCriteria.minCgpa = values.minCgpa;
      if (values.minSscPercentage) dto.eligibilityCriteria.minSscPercentage = values.minSscPercentage;
      if (values.minHscPercentage) dto.eligibilityCriteria.minHscPercentage = values.minHscPercentage;
      if (values.requiredSkills) {
        dto.eligibilityCriteria.requiredSkills = values.requiredSkills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }

      // Aptitude Config
      if (values.hasAptitude) {
        const questionDistribution = [];
        if (values.aptitudeEasyCount && values.aptitudeEasyCount > 0) {
          questionDistribution.push({
            difficulty: QuestionDifficulty.EASY,
            count: values.aptitudeEasyCount,
          });
        }
        if (values.aptitudeMediumCount && values.aptitudeMediumCount > 0) {
          questionDistribution.push({
            difficulty: QuestionDifficulty.MEDIUM,
            count: values.aptitudeMediumCount,
          });
        }
        if (values.aptitudeHardCount && values.aptitudeHardCount > 0) {
          questionDistribution.push({
            difficulty: QuestionDifficulty.HARD,
            count: values.aptitudeHardCount,
          });
        }

        dto.aptitudeConfig = {
          totalQuestions: values.aptitudeTotalQuestions,
          durationMinutes: values.aptitudeDuration,
          questionDistribution,
        };
      }

      // Machine Test Config
      if (values.hasMachineTest) {
        const problemDistribution = [];
        if (values.machineTestEasyCount && values.machineTestEasyCount > 0) {
          problemDistribution.push({
            difficulty: QuestionDifficulty.EASY,
            count: values.machineTestEasyCount,
            pointsPerProblem: values.machineTestEasyPoints || 50,
          });
        }
        if (values.machineTestMediumCount && values.machineTestMediumCount > 0) {
          problemDistribution.push({
            difficulty: QuestionDifficulty.MEDIUM,
            count: values.machineTestMediumCount,
            pointsPerProblem: values.machineTestMediumPoints || 100,
          });
        }
        if (values.machineTestHardCount && values.machineTestHardCount > 0) {
          problemDistribution.push({
            difficulty: QuestionDifficulty.HARD,
            count: values.machineTestHardCount,
            pointsPerProblem: values.machineTestHardPoints || 150,
          });
        }

        dto.machineTestConfig = {
          totalProblems: values.machineTestTotalProblems,
          durationMinutes: values.machineTestDuration,
          problemDistribution,
          allowMultipleSubmissions: true,
        };
      }

      // AI Interview Config
      if (values.hasAiInterview) {
        dto.aiInterviewConfig = {
          jobTitle: values.aiInterviewJobTitle,
          companyName: values.aiInterviewCompanyName,
          totalQuestions: values.aiInterviewTotalQuestions,
          durationMinutes: values.aiInterviewDuration,
          requireResume: values.aiInterviewRequireResume,
        };
      }

      await createMockDrive(dto);

      toast({
        title: 'Success',
        description: 'Mock drive created successfully',
      });

      router.push('/admin/mock-drive');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create mock drive',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

        {/* Continuing from previous TabsList... */}

          {/* BASIC INFO TAB */}
          <TabsContent value="basic" className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mock Drive Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Tech Giants Mock Drive 2024"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your mock drive a clear, descriptive title
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the mock drive, what students can expect, etc."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eligibleYear"
                render={() => (
                  <FormItem>
                    <FormLabel>Eligible Years *</FormLabel>
                    <FormDescription>
                      Select which academic years can participate
                    </FormDescription>
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      {[1, 2, 3, 4].map((year) => (
                        <FormField
                          key={year}
                          control={form.control}
                          name="eligibleYear"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(year)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, year]);
                                    } else {
                                      field.onChange(
                                        current.filter((y) => y !== year)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Year {year}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* ELIGIBILITY TAB */}
          <TabsContent value="eligibility" className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="minCgpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum CGPA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          placeholder="7.0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minSscPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum SSC %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="60"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minHscPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum HSC %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="60"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requiredSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., JavaScript, Python, React (comma separated)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter required skills separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* TESTS TAB */}
          <TabsContent value="tests" className="space-y-6">
            {/* Test Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Test Types *</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="hasAptitude"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aptitude Test</FormLabel>
                        <FormDescription>
                          Include aptitude assessment
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasMachineTest"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Machine Test</FormLabel>
                        <FormDescription>
                          Include coding problems
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasAiInterview"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>AI Interview</FormLabel>
                        <FormDescription>
                          Include AI-powered interview
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* APTITUDE CONFIG */}
            {hasAptitude && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Aptitude Test Configuration
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="aptitudeTotalQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Questions *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="30"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aptitudeDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="60"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>Question Distribution</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <FormField
                        control={form.control}
                        name="aptitudeEasyCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Easy Questions
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="15"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseInt(e.target.value) : 0
                                  )
                                }
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="aptitudeMediumCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Medium Questions
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="10"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseInt(e.target.value) : 0
                                  )
                                }
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="aptitudeHardCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Hard Questions
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="5"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseInt(e.target.value) : 0
                                  )
                                }
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* MACHINE TEST CONFIG */}
            {hasMachineTest && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Machine Test Configuration
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="machineTestTotalProblems"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Problems *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="3"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="machineTestDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="90"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>Problem Distribution</FormLabel>
                    <div className="space-y-3 mt-2">
                      {/* Easy Problems */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="machineTestEasyCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                Easy Problems
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value) : 0
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="machineTestEasyPoints"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                Points Each
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="50"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value) : 0
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Medium Problems */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="machineTestMediumCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                Medium Problems
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value) : 0
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="machineTestMediumPoints"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                Points Each
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="100"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value) : 0
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Hard Problems */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="machineTestHardCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                Hard Problems
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value) : 0
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="machineTestHardPoints"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-muted-foreground">
                                Points Each
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="150"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseInt(e.target.value) : 0
                                    )
                                  }
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* AI INTERVIEW CONFIG */}
            {hasAiInterview && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">
                  AI Interview Configuration
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="aiInterviewJobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Software Engineer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aiInterviewCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Google" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="aiInterviewTotalQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Questions *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="5"
                              max="20"
                              placeholder="10"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>Between 5 and 20 questions</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aiInterviewDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="15"
                              max="60"
                              placeholder="30"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>Between 15 and 60 minutes</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="aiInterviewRequireResume"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Require Resume</FormLabel>
                          <FormDescription>
                            Students must upload/select a resume before starting
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            )}
          </TabsContent>

          {/* SCHEDULE TAB */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Registration Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registrationStartDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Drive Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="driveStartDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driveEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* REVIEW TAB */}
          <TabsContent value="review" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Review Your Mock Drive</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="text-base">{form.watch('title') || '-'}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Eligible Years
                  </p>
                  <p className="text-base">
                    {form.watch('eligibleYear')?.length > 0
                      ? `Year ${form.watch('eligibleYear')?.join(', ')}`
                      : '-'}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Selected Tests
                  </p>
                  <div className="flex gap-2 mt-1">
                    {hasAptitude && (
                      <Badge variant="secondary">
                        Aptitude ({form.watch('aptitudeDuration')}min)
                      </Badge>
                    )}
                    {hasMachineTest && (
                      <Badge variant="secondary">
                        Machine Test ({form.watch('machineTestDuration')}min)
                      </Badge>
                    )}
                    {hasAiInterview && (
                      <Badge variant="secondary">
                        AI Interview ({form.watch('aiInterviewDuration')}min)
                      </Badge>
                    )}
                    {!hasAptitude && !hasMachineTest && !hasAiInterview && (
                      <p className="text-sm text-muted-foreground">
                        No tests selected
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total Duration:{' '}
                    {(form.watch('aptitudeDuration') || 0) +
                      (form.watch('machineTestDuration') || 0) +
                      (form.watch('aiInterviewDuration') || 0)}{' '}
                    minutes
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Registration Period
                    </p>
                    <p className="text-base">
                      {form.watch('registrationStartDate')
                        ? format(form.watch('registrationStartDate'), 'PPP')
                        : '-'}{' '}
                      <br />
                      to <br />
                      {form.watch('registrationEndDate')
                        ? format(form.watch('registrationEndDate'), 'PPP')
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Drive Period
                    </p>
                    <p className="text-base">
                      {form.watch('driveStartDate')
                        ? format(form.watch('driveStartDate'), 'PPP')
                        : '-'}{' '}
                      <br />
                      to <br />
                      {form.watch('driveEndDate')
                        ? format(form.watch('driveEndDate'), 'PPP')
                        : '-'}
                    </p>
                  </div>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Publish Immediately</FormLabel>
                        <FormDescription>
                          Make this mock drive visible to students right away
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Mock Drive'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
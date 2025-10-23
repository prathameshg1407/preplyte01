'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Download, 
  Save, 
  ChevronLeft,
  Palette,
  Layout,
  Eye,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import type { ResumeProfileData, TemplateType, ResumeSection } from '@/types/resume-builder.types';
import { 
  getSavedResumeDetails,
  generateResumePreview,
  downloadGeneratedResume,
  updateSavedResume,
} from '@/lib/api/resume-builder.client';
import TemplatePreview from '@/components/resume/TemplatePreview';

export default function TemplateSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = parseInt(params.id as string);

  const [profileData, setProfileData] = useState<ResumeProfileData | null>(null);
  const [resumeTitle, setResumeTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<string | null>(null);
  
  const [customization, setCustomization] = useState<{
    primaryColor?: string;
    fontFamily?: string;
    sectionsOrder?: ResumeSection[];
    hiddenSections?: ResumeSection[];
  }>({
    primaryColor: '#2b6cb0',
    fontFamily: 'Helvetica',
    sectionsOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
    hiddenSections: [],
  });

  // Ref to store the timeout ID for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const templates = [
    { id: 'modern', name: 'Modern', description: 'Clean design with colored header' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant layout' },
    { id: 'professional', name: 'Professional', description: 'Traditional business format' },
    { id: 'creative', name: 'Creative', description: 'Stand out with unique design' },
    { id: 'corporate', name: 'Corporate', description: 'Formal executive style' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated typography' },
  ];

  const sections: { value: ResumeSection; label: string }[] = [
    { value: 'summary', label: 'Summary' },
    { value: 'experience', label: 'Experience' },
    { value: 'education', label: 'Education' },
    { value: 'skills', label: 'Skills' },
    { value: 'projects', label: 'Projects' },
    { value: 'certifications', label: 'Certifications' },
  ];

  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New'];

  // Memoized preview generation function
  const generatePreview = useCallback(async () => {
    if (!profileData) return;
    
    setIsPreviewLoading(true);
    try {
      const response = await generateResumePreview(profileData, {
        template: selectedTemplate,
        primaryColor: customization.primaryColor,
        fontFamily: customization.fontFamily,
        sectionsOrder: customization.sectionsOrder,
        hiddenSections: customization.hiddenSections,
      });
      setPreviewData(response.preview);
    } catch (error: any) {
      console.error('Error generating preview:', error);
      toast.error(error.message || 'Failed to generate preview');
    } finally {
      setIsPreviewLoading(false);
    }
  }, [profileData, selectedTemplate, customization]);

  // Load resume data on mount
  useEffect(() => {
    loadResumeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  // Debounced preview generation when customization changes
  useEffect(() => {
    if (!profileData) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for preview generation
    debounceTimeoutRef.current = setTimeout(() => {
      generatePreview();
    }, 500);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [profileData, selectedTemplate, customization, generatePreview]);

  const loadResumeData = async () => {
    try {
      const resume = await getSavedResumeDetails(resumeId);
      
      if (!resume.content) {
        toast.error('Resume data not found');
        router.push('/resume-builder');
        return;
      }

      const content = JSON.parse(resume.content);
      const data = content.profileData || content.profile;
      
      if (!data || !data.fullName) {
        toast.error('Invalid resume data');
        router.push('/resume-builder');
        return;
      }

      setProfileData(data);
      setResumeTitle(resume.title);
      
      // Load saved template and customization
      if (content.template) {
        setSelectedTemplate(content.template as TemplateType);
      }
      if (content.customSettings) {
        setCustomization(prev => ({ ...prev, ...content.customSettings }));
      }
      
      toast.success('Resume loaded successfully');
    } catch (error: any) {
      console.error('Error loading resume:', error);
      toast.error(error.message || 'Failed to load resume data');
      router.push('/resume-builder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionToggle = (section: ResumeSection) => {
    const hidden = customization.hiddenSections || [];
    const updated = hidden.includes(section)
      ? hidden.filter(s => s !== section)
      : [...hidden, section];
    
    setCustomization(prev => ({ ...prev, hiddenSections: updated }));
  };

  const handleReset = () => {
    setCustomization({
      primaryColor: '#2b6cb0',
      fontFamily: 'Helvetica',
      sectionsOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
      hiddenSections: [],
    });
    toast.success('Settings reset to default');
  };

  const handleSave = async () => {
    if (!profileData) return;
    
    if (!resumeTitle.trim()) {
      toast.error('Please enter a resume title');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateSavedResume(resumeId, {
        title: resumeTitle,
        template: selectedTemplate,
        profileData: profileData,
        customSettings: {
          primaryColor: customization.primaryColor,
          fontFamily: customization.fontFamily,
          sectionsOrder: customization.sectionsOrder,
          hiddenSections: customization.hiddenSections,
        },
      });
      
      toast.success('Resume settings saved successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!profileData) return;
    
    setIsGenerating(true);
    try {
      await downloadGeneratedResume(
        profileData,
        {
          template: selectedTemplate,
          primaryColor: customization.primaryColor,
          fontFamily: customization.fontFamily,
          sectionsOrder: customization.sectionsOrder,
          hiddenSections: customization.hiddenSections,
        },
        `${resumeTitle.trim() || 'resume'}.pdf`
      );
      
      toast.success('Resume downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download resume');
    } finally {
      setIsGenerating(false);
    }
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

  if (!profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Label htmlFor="resumeTitle" className="text-sm font-medium">
              Resume Title
            </Label>
            <Input
              id="resumeTitle"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="mt-1"
              placeholder="My Resume"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/resume-builder/edit/${resumeId}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Edit Data
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Template & Customization */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layout className="h-5 w-5" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={selectedTemplate} 
                  onValueChange={(val) => setSelectedTemplate(val as TemplateType)}
                >
                  {templates.map((template) => (
                    <div key={template.id} className="mb-3">
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem 
                          value={template.id} 
                          id={template.id} 
                          className="mt-1" 
                        />
                        <Label 
                          htmlFor={template.id} 
                          className="cursor-pointer flex-1"
                        >
                          <div>
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Customization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5" />
                  Customize
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color Picker */}
                <div>
                  <Label htmlFor="primaryColor" className="text-sm">
                    Primary Color
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization(prev => ({ 
                        ...prev, 
                        primaryColor: e.target.value 
                      }))}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization(prev => ({ 
                        ...prev, 
                        primaryColor: e.target.value 
                      }))}
                      placeholder="#000000"
                      className="flex-1"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <Label htmlFor="fontFamily" className="text-sm">
                    Font Family
                  </Label>
                  <Select
                    value={customization.fontFamily}
                    onValueChange={(value) => setCustomization(prev => ({ 
                      ...prev, 
                      fontFamily: value 
                    }))}
                  >
                    <SelectTrigger id="fontFamily" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Section Visibility */}
                <div>
                  <Label className="text-sm mb-3 block">
                    Visible Sections
                  </Label>
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <div 
                        key={section.value} 
                        className="flex items-center justify-between"
                      >
                        <Label 
                          htmlFor={section.value} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {section.label}
                        </Label>
                        <Switch
                          id={section.value}
                          checked={!customization.hiddenSections?.includes(section.value)}
                          onCheckedChange={() => handleSectionToggle(section.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Reset Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                    {isPreviewLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || !resumeTitle.trim()}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDownload}
                      disabled={isGenerating || isPreviewLoading}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {isGenerating ? 'Generating...' : 'Download PDF'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg overflow-hidden bg-white shadow-sm relative" 
                  style={{ height: '800px' }}
                >
                  {isPreviewLoading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Generating preview...</p>
                      </div>
                    </div>
                  )}
                  {previewData ? (
                    <iframe
                      src={`data:application/pdf;base64,${previewData}`}
                      className="w-full h-full"
                      title="Resume Preview"
                    />
                  ) : (
                    <div className="overflow-auto h-full">
                      <TemplatePreview
                        data={{
                          ...profileData,
                          template: selectedTemplate,
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
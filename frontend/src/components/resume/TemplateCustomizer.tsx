import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { ResumeSection } from '@/types/resume-builder.types';

interface TemplateCustomization {
  primaryColor?: string;
  fontFamily?: string;
  sectionsOrder?: ResumeSection[];
  hiddenSections?: ResumeSection[];
}

interface TemplateCustomizerProps {
  customization: TemplateCustomization;
  onChange: (customization: TemplateCustomization) => void;
}

export default function TemplateCustomizer({ customization, onChange }: TemplateCustomizerProps) {
  const sections: { value: ResumeSection; label: string }[] = [
    { value: 'summary', label: 'Summary' },
    { value: 'experience', label: 'Experience' },
    { value: 'education', label: 'Education' },
    { value: 'skills', label: 'Skills' },
    { value: 'projects', label: 'Projects' },
    { value: 'certifications', label: 'Certifications' },
    { value: 'languages', label: 'Languages' },
    { value: 'achievements', label: 'Achievements' },
  ];

  const fonts: string[] = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
  ];

  const handleSectionToggle = (section: ResumeSection) => {
    const hidden = customization.hiddenSections || [];
    const updated = hidden.includes(section)
      ? hidden.filter((s) => s !== section)
      : [...hidden, section];
    
    onChange({
      ...customization,
      hiddenSections: updated,
    });
  };

  const handleColorChange = (value: string) => {
    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    // Allow partial input while typing
    if (value.startsWith('#')) {
      onChange({
        ...customization,
        primaryColor: value,
      });
    } else if (hexRegex.test('#' + value)) {
      onChange({
        ...customization,
        primaryColor: '#' + value,
      });
    }
  };

  const handleReset = () => {
    onChange({
      primaryColor: '#2b6cb0',
      fontFamily: 'Helvetica',
      sectionsOrder: [
        'summary',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
      ] as ResumeSection[],
      hiddenSections: [] as ResumeSection[],
    });
    toast.success('Customization reset to default');
  };

  return (
    <div className="space-y-6">
      {/* Color Picker */}
      <div>
        <Label htmlFor="primaryColor" className="text-sm font-medium">
          Primary Color
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Choose the accent color for your resume
        </p>
        <div className="flex gap-2">
          <Input
            id="primaryColor"
            type="color"
            value={customization.primaryColor || '#2b6cb0'}
            onChange={(e) => onChange({ 
              ...customization, 
              primaryColor: e.target.value 
            })}
            className="w-16 h-10 p-1 cursor-pointer"
            title="Pick a color"
          />
          <Input
            value={customization.primaryColor || '#2b6cb0'}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#2b6cb0"
            className="flex-1 font-mono"
            maxLength={7}
            pattern="^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
          />
        </div>
      </div>

      <Separator />

      {/* Font Family */}
      <div>
        <Label htmlFor="fontFamily" className="text-sm font-medium">
          Font Family
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select the font style for your resume
        </p>
        <Select
          value={customization.fontFamily || 'Helvetica'}
          onValueChange={(value) => onChange({ 
            ...customization, 
            fontFamily: value 
          })}
        >
          <SelectTrigger id="fontFamily">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Section Visibility */}
      <div>
        <Label className="text-sm font-medium">Section Visibility</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Toggle which sections appear in your resume
        </p>
        <div className="space-y-3">
          {sections.map((section) => (
            <div 
              key={section.value} 
              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
            >
              <Label 
                htmlFor={section.value} 
                className="font-normal text-sm cursor-pointer flex-1"
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
    </div>
  );
}
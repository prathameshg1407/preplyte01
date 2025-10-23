'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplatePreview from './TemplatePreview';
import type { UserProfile, TemplateType } from '@/types/resume-builder.types';

interface TemplatePreviewDialogProps {
  data: UserProfile;
  open: boolean;
  onClose: () => void;
}

export default function TemplatePreviewDialog({ data, open, onClose }: TemplatePreviewDialogProps) {
  const templates: { id: TemplateType; name: string }[] = [
    { id: 'modern', name: 'Modern' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'professional', name: 'Professional' },
    { id: 'creative', name: 'Creative' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'elegant', name: 'Elegant' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resume Preview</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="modern" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {templates.map((template) => (
              <TabsTrigger key={template.id} value={template.id}>
                {template.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {templates.map((template) => (
            <TabsContent key={template.id} value={template.id}>
              <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
                <div className="overflow-auto h-full">
                  <TemplatePreview
                    data={{
                      ...data,
                      template: template.id,
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
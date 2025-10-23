'use client';

import { useState, useRef, useCallback, memo } from 'react';
import { Upload, Trash2, FileText, Loader2, Eye, Star, Download } from 'lucide-react';

import type { FullUserProfile, Resume } from '@/types';
import { useUI } from '@/contexts/UIContext';
import { downloadFile } from '@/lib/api/client';
import { 
  uploadResume, 
  deleteResume, 
  setPrimaryResume 
} from '@/lib/api/resume.client';

interface ResumeSectionProps {
  user: FullUserProfile;
  onUpdate: () => void;
  onView: (resumeUrl: string) => void;
}

/**
 * Manages resume upload, display, and deletion
 */
function ResumeSection({ user, onUpdate, onView }: ResumeSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useUI();

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.type)) {
        showToast({
          type: 'error',
          message: 'Only PDF and Word documents are allowed',
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          type: 'error',
          message: 'File size must be less than 10MB',
        });
        return;
      }

      setIsUploading(true);

      showToast({
        type: 'info',
        message: `Uploading ${file.name}...`,
      });

      try {
        await uploadResume(file, { 
          title: file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: (user.resumes || []).length === 0, // Set as primary if first resume
        });

        onUpdate();
        
        showToast({
          type: 'success',
          message: 'Resume uploaded successfully!',
        });
      } catch (error: any) {
        console.error('Resume upload error:', error);
        showToast({
          type: 'error',
          message: error.message || 'Failed to upload resume',
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onUpdate, showToast, user.resumes]
  );

  const handleDelete = useCallback(
    async (resumeId: number) => {
      if (!confirm('Are you sure you want to delete this resume?')) {
        return;
      }

      setDeletingId(resumeId);
      
      showToast({
        type: 'info',
        message: 'Deleting resume...',
      });

      try {
        await deleteResume(resumeId);
        onUpdate();
        
        showToast({
          type: 'success',
          message: 'Resume deleted successfully',
        });
      } catch (error: any) {
        console.error('Resume delete error:', error);
        showToast({
          type: 'error',
          message: error.message || 'Failed to delete resume',
        });
      } finally {
        setDeletingId(null);
      }
    },
    [onUpdate, showToast]
  );

  const handleSetPrimary = useCallback(
    async (resumeId: number) => {
      setSettingPrimaryId(resumeId);

      try {
        await setPrimaryResume(resumeId);
        onUpdate();
        
        showToast({
          type: 'success',
          message: 'Primary resume updated',
        });
      } catch (error: any) {
        console.error('Set primary error:', error);
        showToast({
          type: 'error',
          message: error.message || 'Failed to set primary resume',
        });
      } finally {
        setSettingPrimaryId(null);
      }
    },
    [onUpdate, showToast]
  );

  const handleDownload = useCallback(
    async (resume: Resume) => {
      try {
        await downloadFile(
          `/profile/me/resumes/${resume.id}/download`,
          resume.filename || resume.title || 'resume.pdf'
        );
        
        showToast({
          type: 'success',
          message: 'Resume downloaded',
        });
      } catch (error: any) {
        console.error('Download error:', error);
        showToast({
          type: 'error',
          message: 'Failed to download resume',
        });
      }
    },
    [showToast]
  );

  const handleView = useCallback(
    (resume: Resume) => {
      if (resume.storagePath) {
        onView(resume.storagePath);
      } else {
        showToast({
          type: 'error',
          message: 'Resume URL not available',
        });
      }
    },
    [onView, showToast]
  );

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="text-primary" size={24} />
              My Resumes
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your resumes and set a primary one for applications
            </p>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
            disabled={isUploading}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span className="hidden sm:inline">Upload New</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {(user.resumes || []).length > 0 ? (
          <div className="space-y-3">
            {(user.resumes || []).map((resume) => (
              <div
                key={resume.id}
                className={`group flex items-center justify-between bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-lg border transition-all hover:border-primary/40 ${
                  deletingId === resume.id ? 'opacity-50' : 'opacity-100'
                } ${resume.isPrimary ? 'ring-2 ring-primary/30' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg ${resume.isPrimary ? 'bg-primary/10' : 'bg-muted'}`}>
                    <FileText 
                      className={resume.isPrimary ? 'text-primary' : 'text-muted-foreground'} 
                      size={24} 
                    />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-base truncate">
                        {resume.title}
                      </span>
                      {resume.isPrimary && (
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                          <Star size={12} fill="currentColor" />
                          Primary
                        </span>
                      )}
                    </div>
                    {resume.filename && (
                      <p className="text-xs text-muted-foreground truncate">
                        {resume.filename}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {!resume.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(resume.id)}
                      disabled={settingPrimaryId === resume.id}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:cursor-not-allowed"
                      title="Set as primary"
                    >
                      {settingPrimaryId === resume.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Star size={18} />
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleView(resume)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View resume"
                  >
                    <Eye size={18} />
                  </button>
                  
                  <button
                    onClick={() => handleDownload(resume)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Download resume"
                  >
                    <Download size={18} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(resume.id)}
                    disabled={deletingId === resume.id}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:cursor-not-allowed"
                    title="Delete resume"
                  >
                    {deletingId === resume.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              No resumes uploaded yet
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your resume to start applying for opportunities
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-md"
            >
              <Upload size={18} />
              Upload Your First Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ResumeSection);
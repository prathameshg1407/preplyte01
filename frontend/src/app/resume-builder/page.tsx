'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Target, 
  Plus,
  Edit,
  Trash2,
  Download,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getSavedResumes, deleteSavedResume, downloadSavedResume } from '@/lib/api/resume-builder.client';
import type { SavedResume } from '@/types/resume-builder.types';
import { toast } from 'sonner';

export default function ResumeBuilder() {
  const router = useRouter();
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<SavedResume | null>(null);

  useEffect(() => {
    loadSavedResumes();
  }, []);

  const loadSavedResumes = async () => {
    try {
      setLoadError(null);
      const resumes = await getSavedResumes();
      setSavedResumes(resumes);
    } catch (error: any) {
      console.error('Error loading resumes:', error);
      const errorMessage = error.message || 'Failed to load resumes';
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (resume: SavedResume) => {
    setResumeToDelete(resume);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return;
    
    const resumeId = resumeToDelete.id;
    setDeletingId(resumeId);
    
    try {
      await deleteSavedResume(resumeId);
      setSavedResumes(prev => prev.filter(r => r.id !== resumeId));
      toast.success('Resume deleted successfully');
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete resume');
    } finally {
      setDeletingId(null);
      setResumeToDelete(null);
    }
  };

  const handleDownload = async (id: number, title: string) => {
    setDownloadingId(id);
    
    try {
      await downloadSavedResume(id, `${title}.pdf`);
      toast.success('Resume downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download resume');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-12 animate-fade-in-down">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
            Professional Resume Builder
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Create stunning resumes with AI-powered templates. Build resumes for yourself, friends, or clients.
          </p>
          
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push('/resume-builder/create')}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Create New Resume
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/resume-builder/ats-check')}
              className="gap-2"
            >
              <Target className="h-5 w-5" />
              Check ATS Score
            </Button>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Saved Resumes */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Your Saved Resumes</h2>
              <p className="text-muted-foreground">Manage and download your created resumes</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading resumes...</p>
            </div>
          ) : loadError ? (
            <Card className="text-center py-12 border-destructive">
              <CardContent className="pt-6">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-destructive">Failed to Load Resumes</h3>
                <p className="text-muted-foreground mb-4">{loadError}</p>
                <Button onClick={loadSavedResumes} variant="outline">
                  <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : savedResumes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No resumes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first resume to get started
                </p>
                <Button onClick={() => router.push('/resume-builder/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Resume
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedResumes.map((resume) => (
                <Card key={resume.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-1">{resume.title}</CardTitle>
                    <CardDescription>
                      Updated {new Date(resume.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/resume-builder/edit/${resume.id}`)}
                        className="flex-1"
                        disabled={deletingId === resume.id || downloadingId === resume.id}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(resume.id, resume.title)}
                        className="flex-1"
                        disabled={downloadingId === resume.id || deletingId === resume.id}
                      >
                        {downloadingId === resume.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(resume)}
                        disabled={deletingId === resume.id || downloadingId === resume.id}
                      >
                        {deletingId === resume.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Separator className="my-12" />

        {/* Features Grid */}
        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>6+ Professional Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Choose from Modern, Minimal, Professional, Creative, Corporate, and Elegant designs.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>ATS Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AI-powered ATS score checker ensures your resume passes screening systems.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Multiple Resumes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create unlimited resumes for different people or different job applications.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resume "{resumeToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
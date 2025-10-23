"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInterview } from "@/hooks/useInterview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, Mic, FileText, Building2, Briefcase, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api/client";
import { VoiceRecognition, checkVoiceRecognitionSupport } from "@/lib/speech-recognition";
import type { Resume } from "@/types";

export default function AIInterviewStart() {
  const router = useRouter();
  const { toast } = useToast();
  const fetchInitiated = useRef(false);

  // Interview hook
  const {
    phase,
    startSession,
    error: hookError,
    loading,
    micPermission,
  } = useInterview();

  // Form state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("none");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isFetchingResumes, setIsFetchingResumes] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    jobTitle?: string;
  }>({});

  // Dialog state
  const [showMicPermissionDialog, setShowMicPermissionDialog] = useState(false);
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false);

  // Browser support check
  const [voiceSupport, setVoiceSupport] = useState<{
    supported: boolean;
    browser: string;
    recommendation?: string;
  } | null>(null);

  // ============= Effects =============

  // Check voice recognition support
  useEffect(() => {
    const support = checkVoiceRecognitionSupport();
    setVoiceSupport(support);
    
    if (!support.supported) {
      toast({
        title: "Browser Not Supported",
        description: support.recommendation || "Voice recognition is not supported in your browser.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch resumes
  useEffect(() => {
    if (fetchInitiated.current) return;
    fetchInitiated.current = true;

    const fetchResumes = async () => {
      console.log("[AIInterviewStart] Fetching resumes");
      setIsFetchingResumes(true);
      setFetchError(null);

      try {
        const response = await apiFetch<Resume[]>("/profile/me/resumes");
        console.log("[AIInterviewStart] Resumes fetched:", response.length);
        setResumes(response);
      } catch (error: any) {
        console.error("[AIInterviewStart] Failed to fetch resumes:", error);
        const errorMessage = error.message || "Could not fetch your resumes.";
        setFetchError(errorMessage);
        toast({
          title: "Error Loading Resumes",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsFetchingResumes(false);
      }
    };

    fetchResumes();
  }, [toast]);

  // Check microphone permission
  useEffect(() => {
    if (micPermission === false) {
      setShowMicPermissionDialog(true);
    }
  }, [micPermission]);

  // ============= Validation =============

  const validateForm = useCallback((): boolean => {
    const errors: { jobTitle?: string } = {};

    // Validate job title
    if (!jobTitle.trim()) {
      errors.jobTitle = "Job title is required";
    } else if (jobTitle.trim().length < 3) {
      errors.jobTitle = "Job title must be at least 3 characters";
    } else if (jobTitle.trim().length > 100) {
      errors.jobTitle = "Job title must be less than 100 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [jobTitle]);

  // ============= Handlers =============

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJobTitle(value);
    
    // Clear validation error when user types
    if (validationErrors.jobTitle && value.trim().length >= 3) {
      setValidationErrors((prev) => ({ ...prev, jobTitle: undefined }));
    }
  };

  const handleResumeChange = (value: string) => {
    console.log("[AIInterviewStart] Selected resume ID:", value);
    setSelectedResumeId(value);
  };

  const handleStartClick = () => {
    if (!validateForm()) {
      console.log("[AIInterviewStart] Validation failed");
      toast({
        title: "Validation Error",
        description: "Please fix the errors before starting the interview.",
        variant: "destructive",
      });
      return;
    }

    // Check voice support
    if (!voiceSupport?.supported) {
      toast({
        title: "Browser Not Supported",
        description: voiceSupport?.recommendation || "Voice recognition is not supported.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    setShowStartConfirmDialog(true);
  };

  const handleConfirmStart = async () => {
    setShowStartConfirmDialog(false);

    console.log("[AIInterviewStart] Starting interview with:", {
      jobTitle,
      selectedResumeId,
      companyName,
    });

    try {
      const resumeIdAsNumber =
        selectedResumeId !== "none" ? parseInt(selectedResumeId, 10) : undefined;

      await startSession({
        jobTitle: jobTitle.trim(),
        resumeId: resumeIdAsNumber,
        companyName: companyName.trim() || undefined,
      });

      console.log("[AIInterviewStart] Session started successfully");
    } catch (error: any) {
      console.error("[AIInterviewStart] Failed to start interview:", error);
      
      const errorMessage = error.message || "Could not create interview session. Please try again.";
      
      toast({
        title: "Error Starting Interview",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRequestMicPermission = async () => {
    try {
      const hasPermission = await VoiceRecognition.requestPermission();
      if (hasPermission) {
        setShowMicPermissionDialog(false);
        toast({
          title: "Permission Granted",
          description: "Microphone access has been granted.",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable microphone access in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[AIInterviewStart] Permission request failed:", error);
      toast({
        title: "Error",
        description: "Failed to request microphone permission.",
        variant: "destructive",
      });
    }
  };

  // ============= Computed Values =============

  const isSubmitDisabled =
    loading ||
    isFetchingResumes ||
    !jobTitle.trim() ||
    !!validationErrors.jobTitle ||
    !voiceSupport?.supported;

  const selectedResume = resumes.find(
    (r) => r.id.toString() === selectedResumeId
  );

  // ============= Render =============

  // Don't show if not in start phase
  if (phase !== "start") return null;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Mic className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">AI Interview Practice</CardTitle>
          <CardDescription className="text-base">
            Get personalized interview questions tailored to your profile and target role
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Browser Support Warning */}
          {voiceSupport && !voiceSupport.supported && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Browser Not Supported</AlertTitle>
              <AlertDescription>
                {voiceSupport.recommendation}
                <br />
                Current browser: {voiceSupport.browser}
              </AlertDescription>
            </Alert>
          )}

          {/* Microphone Permission Warning */}
          {micPermission === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Microphone Access Required</AlertTitle>
              <AlertDescription>
                Please enable microphone access to use voice recognition.
                <Button
                  variant="link"
                  size="sm"
                  className="pl-0 h-auto"
                  onClick={handleRequestMicPermission}
                >
                  Request Permission
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Resume Selection */}
          <div className="space-y-2">
            <Label htmlFor="resume" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Select Your Resume (Optional)
            </Label>
            {isFetchingResumes ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading your resumes...
              </div>
            ) : fetchError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fetchError}</AlertDescription>
              </Alert>
            ) : resumes.length > 0 ? (
              <Select
                value={selectedResumeId}
                onValueChange={handleResumeChange}
                disabled={loading || isFetchingResumes}
              >
                <SelectTrigger id="resume">
                  <SelectValue placeholder="Choose a resume..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <span>No Resume</span>
                      <span className="text-xs text-muted-foreground">
                        (General interview)
                      </span>
                    </div>
                  </SelectItem>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id.toString()}>
                      <div className="flex flex-col">
                        <span>{resume.title}</span>
                        {resume.filename && (
                          <span className="text-xs text-muted-foreground">
                            {resume.filename}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-col items-start space-y-3 p-4 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No resumes found. Upload a resume for personalized questions.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/resume")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Resume
                </Button>
              </div>
            )}
            {selectedResume && (
              <p className="text-xs text-muted-foreground mt-1">
                Using: {selectedResume.title}
              </p>
            )}
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="job-title" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="job-title"
              placeholder="e.g., Senior Frontend Developer"
              value={jobTitle}
              onChange={handleJobTitleChange}
              disabled={isFetchingResumes || loading}
              className={validationErrors.jobTitle ? "border-red-500" : ""}
              maxLength={100}
            />
            {validationErrors.jobTitle && (
              <p className="text-sm text-red-500">{validationErrors.jobTitle}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {jobTitle.length}/100 characters
            </p>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Name (Optional)
            </Label>
            <Input
              id="company-name"
              placeholder="e.g., Google, Microsoft, etc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isFetchingResumes || loading}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for general practice
            </p>
          </div>

          {/* Info Box */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Interview Format</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              <p>• 10 questions: 1 intro, 8 technical, 1 closing</p>
              <p>• Voice-based interaction with AI interviewer</p>
              <p>• Real-time feedback on your responses</p>
              <p>• Detailed performance report at the end</p>
            </AlertDescription>
          </Alert>

          {/* Hook Error */}
          {hookError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{hookError}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={handleStartClick}
            disabled={isSubmitDisabled}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Interview...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start AI Interview
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Make sure you're in a quiet environment with a working microphone
          </p>
        </CardFooter>
      </Card>

      {/* Microphone Permission Dialog */}
      <Dialog open={showMicPermissionDialog} onOpenChange={setShowMicPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Microphone Access Required</DialogTitle>
            <DialogDescription>
              This interview uses voice recognition. Please grant microphone access to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <p className="font-semibold mb-2">How to enable microphone:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click the microphone icon in your browser's address bar</li>
                  <li>Select "Allow" for microphone access</li>
                  <li>Refresh the page if needed</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMicPermissionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestMicPermission}>
              Request Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Confirmation Dialog */}
      <Dialog open={showStartConfirmDialog} onOpenChange={setShowStartConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to Start?</DialogTitle>
            <DialogDescription>
              Please confirm your interview details before starting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Job Title</p>
                  <p className="text-sm text-muted-foreground">{jobTitle}</p>
                </div>
              </div>
              {companyName && (
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground">{companyName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Resume</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedResume ? selectedResume.title : "No resume selected"}
                  </p>
                </div>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                The interview will last approximately 15-20 minutes. Make sure you're in a
                quiet environment and won't be interrupted.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStartConfirmDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmStart} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Interview"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Lightbulb, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { checkATSScore } from '@/lib/api/resume-builder.client';
import type { ATSAnalysis } from '@/types/resume-builder.types';

export default function AtsCheckPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ATSAnalysis | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadingMessages = [
    'Uploading resume...',
    'Extracting text from PDF...',
    'Analyzing keywords...',
    'Checking ATS compatibility...',
    'Generating recommendations...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      let index = 0;
      setLoadingMessage(loadingMessages[index]);
      interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Invalid file type. Please upload a PDF file.');
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File too large. Please upload a file smaller than 5MB.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" selected`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please upload a resume file');
      return;
    }
    
    if (!jobRole.trim() || jobRole.length < 3) {
      toast.error('Please enter a valid job role (minimum 3 characters)');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const analysis = await checkATSScore(file, jobRole.trim());
      setResult(analysis);
      
      toast.success(`Analysis complete! Your ATS score is ${analysis.atsScore}/100`);
    } catch (error: any) {
      console.error('ATS check error:', error);
      toast.error(error.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setJobRole('');
    setResult(null);
    toast.info('Form cleared');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">ATS Resume Checker</h1>
          <p className="text-lg text-muted-foreground">
            Upload your resume and get instant AI-powered ATS compatibility analysis
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Resume Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="resume" className="text-base font-semibold">
                  Upload Resume (PDF)
                </Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="resume"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
                      </div>
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {file && (
                    <div className="mt-3 flex items-center gap-2 text-sm p-3 bg-green-50 border border-green-200 rounded-md">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">{file.name}</span>
                      <span className="text-green-700">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="jobRole" className="text-base font-semibold">
                  Target Job Role
                </Label>
                <Input
                  id="jobRole"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  className="mt-2"
                  required
                  minLength={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the job title you're applying for
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !file || !jobRole.trim()}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                </Button>
                {(file || jobRole || result) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={isLoading}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </form>

            {/* Loading State */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-lg font-medium">{loadingMessage}</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a few moments...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            {result && !isLoading && (
              <motion.div
                className="mt-8 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className={`border-2 ${getScoreBgColor(result.atsScore)}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">ATS Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className={`text-4xl font-bold ${getScoreColor(result.atsScore)}`}>
                          {result.atsScore}/100
                        </div>
                        <Progress 
                          value={result.atsScore} 
                          className="h-3"
                        />
                        <p className="text-sm text-muted-foreground">
                          {result.atsScore >= 80 ? 'Excellent!' : 
                           result.atsScore >= 60 ? 'Good, but can improve' : 
                           'Needs improvement'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border-2 ${getScoreBgColor(result.formatScore)}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">Format Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className={`text-4xl font-bold ${getScoreColor(result.formatScore)}`}>
                          {result.formatScore}/100
                        </div>
                        <Progress 
                          value={result.formatScore} 
                          className="h-3"
                        />
                        <p className="text-sm text-muted-foreground">
                          {result.formatScore >= 80 ? 'Well formatted!' : 
                           result.formatScore >= 60 ? 'Acceptable format' : 
                           'Format needs work'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Keywords Found */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Keywords Found ({result.keywordsFound?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.keywordsFound && result.keywordsFound.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.keywordsFound.map((keyword, index) => (
                          <Badge 
                            key={index} 
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No keywords found for this job role</p>
                    )}
                  </CardContent>
                </Card>

                {/* Keywords Missing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Missing Keywords ({result.keywordsMissing?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.keywordsMissing && result.keywordsMissing.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.keywordsMissing.map((keyword, index) => (
                          <Badge 
                            key={index} 
                            className="bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-green-700">
                        Great! No critical keywords are missing
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.suggestions && result.suggestions.length > 0 ? (
                      <ul className="space-y-3">
                        {result.suggestions.map((suggestion, index) => (
                          <motion.li
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="flex-1 text-sm">{suggestion}</span>
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">
                        No suggestions at this time. Your resume looks good!
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="flex-1"
                  >
                    Check Another Resume
                  </Button>
                  <Button
                    onClick={() => {
                      // Navigate to resume builder
                      window.location.href = '/resume-builder/create';
                    }}
                    className="flex-1"
                  >
                    Build Optimized Resume
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
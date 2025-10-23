"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInterview } from "@/hooks/useInterview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getInterviewFeedback } from "@/lib/api/interview.client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
  Download,
  Share2,
  RotateCcw,
  Home,
  BarChart3,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getScoreColor,
  getScoreLabel,
  formatDate,
} from "@/lib/utils/aiInterview.helpers";
import type { InterviewFeedbackResponse } from "@/types/aiInterview.types";
import { cn } from "@/lib/utils";

// ============= Score Circle Component =============
function ScoreCircle({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const radius = size === "lg" ? 70 : 45;
  const strokeWidth = size === "lg" ? 12 : 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score / 10);
  const label = getScoreLabel(score / 10);

  return (
    <div className={cn(
      "relative",
      size === "lg" ? "w-40 h-40" : "w-24 h-24"
    )}>
      <svg className={cn(
        "transform -rotate-90",
        size === "lg" ? "w-40 h-40" : "w-24 h-24"
      )}>
        <circle
          cx={size === "lg" ? 80 : 48}
          cy={size === "lg" ? 80 : 48}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size === "lg" ? 80 : 48}
          cy={size === "lg" ? 80 : 48}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          "font-bold text-gray-800",
          size === "lg" ? "text-4xl" : "text-2xl"
        )}>
          {score}
        </span>
        <span className={cn(
          "text-gray-500",
          size === "lg" ? "text-sm" : "text-xs"
        )}>
          / 100
        </span>
        {size === "lg" && (
          <span className="text-xs font-medium mt-1" style={{ color }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// ============= Question Feedback Card Component =============
function QuestionFeedbackCard({
  index,
  question,
  answer,
  scores,
}: {
  index: number;
  question: string;
  answer: string;
  scores: any;
}) {
  const avgScore = Math.round(
    (scores.contentScore + scores.fluencyScore + scores.relevanceScore) / 3
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono">
                Q{index + 1}
              </Badge>
              <Badge
                variant="outline"
                style={{
                  borderColor: getScoreColor(avgScore / 10),
                  color: getScoreColor(avgScore / 10),
                }}
              >
                {avgScore}/10
              </Badge>
            </div>
            <p className="text-sm text-gray-700 font-medium">{question}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">{answer}</p>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Content</span>
              <span className="font-medium">{scores.contentScore}/10</span>
            </div>
            <Progress value={scores.contentScore * 10} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Fluency</span>
              <span className="font-medium">{scores.fluencyScore}/10</span>
            </div>
            <Progress value={scores.fluencyScore * 10} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Relevance</span>
              <span className="font-medium">{scores.relevanceScore}/10</span>
            </div>
            <Progress value={scores.relevanceScore * 10} className="h-2" />
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
          <p className="text-sm text-gray-700">{scores.feedback}</p>
        </div>

        {/* Weak Section */}
        {scores.weakSection && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Area to improve:</strong> {scores.weakSection}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ============= Main Component =============
export default function AIInterviewResults() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { fullTranscript } = useInterview();

  const [feedback, setFeedback] = useState<InterviewFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch feedback
  useEffect(() => {
    async function fetchFeedback() {
      if (!sessionId || typeof sessionId !== "string") {
        setError("Invalid session ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getInterviewFeedback(sessionId);
        setFeedback(data);
      } catch (err: any) {
        console.error("[AIInterviewResults] Error fetching feedback:", err);
        setError(err.message || "Failed to load feedback");
        toast({
          title: "Error Loading Feedback",
          description: err.message || "Could not load interview feedback",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchFeedback();
  }, [sessionId, toast]);

  // Handlers
  const handleNewInterview = () => {
    router.push("/practice/ai-interview");
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  const handleDownloadReport = () => {
    if (!feedback) return;

    const report = {
      sessionId,
      date: new Date().toISOString(),
      overallScore: feedback.overallScore,
      summary: feedback.overallSummary,
      strengths: feedback.keyStrengths,
      improvements: feedback.areasForImprovement,
      weakSections: feedback.weakSections,
      detailedScores: feedback.perResponseScores,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-report-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Your interview report has been downloaded.",
    });
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast({
        title: "Share Not Supported",
        description: "Your browser doesn't support sharing.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.share({
        title: "AI Interview Results",
        text: `I scored ${feedback?.overallScore}/100 on my AI interview practice!`,
        url: window.location.href,
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Analyzing your performance...</p>
            <p className="text-sm text-muted-foreground text-center">
              Our AI is reviewing your responses and generating personalized feedback
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-center">Failed to Load Results</CardTitle>
            <CardDescription className="text-center">
              {error || "Could not load interview feedback"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Unknown error occurred"}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBackToDashboard} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button onClick={handleNewInterview} className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallScore = feedback.overallScore || 0;
  const scoreColor = getScoreColor(overallScore / 10);
  const scoreLabel = getScoreLabel(overallScore / 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold mb-2">
                  <Award className="inline-block mr-2 h-8 w-8" />
                  Interview Results
                </CardTitle>
                <CardDescription className="text-blue-100">
                  {formatDate(new Date())} • Session #{sessionId?.toString().slice(-6)}
                </CardDescription>
              </div>
              <div className="hidden md:flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadReport}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Overall Score Card */}
        <Card className="shadow-lg">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex flex-col items-center">
                <ScoreCircle score={overallScore} />
                <Badge
                  className="mt-4"
                  style={{ backgroundColor: scoreColor, color: "white" }}
                >
                  {scoreLabel}
                </Badge>
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overall Summary</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feedback.overallSummary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {feedback.keyStrengths.slice(0, 3).map((strength, i) => (
                    <Badge key={i} variant="outline" className="text-green-700 border-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="detailed">
              <FileText className="w-4 h-4 mr-2" />
              Detailed
            </TabsTrigger>
            <TabsTrigger value="transcript">
              <MessageSquare className="w-4 h-4 mr-2" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Sparkles className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <TrendingUp className="w-5 h-5" />
                    Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feedback.keyStrengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <Target className="w-5 h-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feedback.areasForImprovement.map((area, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <TrendingDown className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Weak Sections */}
            {feedback.weakSections && feedback.weakSections.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Focus Areas</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {feedback.weakSections.map((section, i) => (
                      <li key={i}>{section}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Detailed Tab */}
          <TabsContent value="detailed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Question-by-Question Analysis</CardTitle>
                <CardDescription>
                  Detailed breakdown of your performance on each question
                </CardDescription>
              </CardHeader>
            </Card>
            <div className="space-y-4">
              {feedback.perResponseScores?.map((score, i) => (
                <QuestionFeedbackCard
                  key={i}
                  index={i}
                  question={fullTranscript[i * 2]?.text || `Question ${i + 1}`}
                  answer={fullTranscript[i * 2 + 1]?.text || "No answer recorded"}
                  scores={score}
                />
              ))}
            </div>
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value="transcript" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Full Interview Transcript</CardTitle>
                <CardDescription>
                  Complete conversation between you and the AI interviewer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {fullTranscript.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-4 rounded-lg border",
                        msg.speaker === "AI"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-green-50 border-green-200"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={
                            msg.speaker === "AI"
                              ? "border-blue-500 text-blue-700"
                              : "border-green-500 text-green-700"
                          }
                        >
                          {msg.speaker === "AI" ? "Interviewer" : "You"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Message {i + 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Performance Breakdown */}
                <div>
                  <h4 className="font-semibold mb-3">Performance Breakdown</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {feedback.perResponseScores && (
                      <>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold">
                                {Math.round(
                                  feedback.perResponseScores.reduce(
                                    (sum, s) => sum + s.contentScore,
                                    0
                                  ) / feedback.perResponseScores.length
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Avg Content
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold">
                                {Math.round(
                                  feedback.perResponseScores.reduce(
                                    (sum, s) => sum + s.fluencyScore,
                                    0
                                  ) / feedback.perResponseScores.length
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Avg Fluency
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold">
                                {Math.round(
                                  feedback.perResponseScores.reduce(
                                    (sum, s) => sum + s.relevanceScore,
                                    0
                                  ) / feedback.perResponseScores.length
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Avg Relevance
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Next Steps */}
                <div>
                  <h4 className="font-semibold mb-3">Recommended Next Steps</h4>
                  <ul className="space-y-2">
                    {feedback.areasForImprovement.slice(0, 3).map((area, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700">
                          Practice and improve your {area.toLowerCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleBackToDashboard}
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadReport}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
              <Button onClick={handleNewInterview} className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
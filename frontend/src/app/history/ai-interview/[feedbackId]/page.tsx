// src/app/history/ai-interview/[feedbackId]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getInterviewFeedbackByIdServer } from "@/lib/api/interview.server";
import AIInterviewResultsView from "@/components/practice/ai-interview/AIInterviewResultsView";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Loading component
function LoadingResults() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading interview results...</p>
          <p className="text-sm text-muted-foreground text-center">
            Fetching your performance data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main page component
export default async function AIInterviewHistoryPage({
  params,
}: {
  params: { feedbackId: string };
}) {
  const { feedbackId } = params;

  // Validate feedbackId
  if (!feedbackId) {
    notFound();
  }

  try {
    // Fetch feedback data server-side
    const feedback = await getInterviewFeedbackByIdServer(feedbackId);

    if (!feedback) {
      notFound();
    }

    return (
      <Suspense fallback={<LoadingResults />}>
        <AIInterviewResultsView 
          feedback={feedback} 
          feedbackId={feedbackId}
          isHistoryView={true}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("[AIInterviewHistoryPage] Error:", error);
    notFound();
  }
}

// Generate metadata
export async function generateMetadata({
  params,
}: {
  params: { feedbackId: string };
}) {
  return {
    title: "Interview Results | Preplyte",
    description: "View your AI interview performance and feedback",
  };
}
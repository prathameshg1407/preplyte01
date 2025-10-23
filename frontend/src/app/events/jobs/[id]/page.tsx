// src/app/events/jobs/[id]/page.tsx
import { getJobPostingWithStatus } from "@/lib/api/event.server"; // Changed to .server
import EventDetailsView from "@/components/events/EventDetailsView";
import { notFound } from "next/navigation";
import { Metadata } from "next";

/**
 * Server Component to pre-fetch details for a single job posting.
 */
export default async function JobDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> // Changed: params is now a Promise
}) {
  const { id } = await params; // Changed: await params before accessing
  const jobId = parseInt(id, 10);

  if (isNaN(jobId)) {
    notFound();
  }

  try {
    const jobDetails = await getJobPostingWithStatus(jobId);

    if (!jobDetails) {
      notFound();
    }

    // Ensure the object is serializable for the client component
    const serializableJobDetails = JSON.parse(JSON.stringify(jobDetails));

    return (
      <EventDetailsView 
        initialEventDetails={serializableJobDetails} 
        eventType="job" 
      />
    );

  } catch (error) {
    console.error('[JobDetailPage] Error:', error);
    // Let the nearest error.tsx handle errors
    throw error;
  }
}

// Metadata generation
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> // Changed: params is now a Promise
}): Promise<Metadata> {
  const { id } = await params; // Changed: await params before accessing
  const jobId = parseInt(id, 10);
  
  if (isNaN(jobId)) {
    return {
      title: 'Job Not Found',
    };
  }

  try {
    const jobDetails = await getJobPostingWithStatus(jobId);
    
    return {
      title: jobDetails?.title || 'Job Posting',
      description: jobDetails?.description?.substring(0, 160) || 'View job details and apply',
    };
  } catch {
    return {
      title: 'Job Posting',
    };
  }
}
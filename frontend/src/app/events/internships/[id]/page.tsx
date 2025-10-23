// src/app/events/internships/[id]/page.tsx
import { getInternshipPostingWithStatus } from "@/lib/api/event.client";
import EventDetailsView from "@/components/events/EventDetailsView";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";

/**
 * Server Component to pre-fetch details for a single internship posting.
 */
export default async function InternshipDetailPage({ params }: { params: { id: string } }) {
  const internshipId = parseInt(params.id, 10);

  if (isNaN(internshipId)) {
    notFound();
  }

  try {
    const internshipDetails = await getInternshipPostingWithStatus(internshipId);

    if (!internshipDetails) {
      notFound();
    }

    const serializableInternshipDetails = JSON.parse(JSON.stringify(internshipDetails));

    return (
      <EventDetailsView 
        initialEventDetails={serializableInternshipDetails} 
        eventType="internship" 
      />
    );

  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    // Let the nearest error.tsx handle other errors
    throw error;
  }
}

// Optional: Add metadata generation
export async function generateMetadata({ params }: { params: { id: string } }) {
  const internshipId = parseInt(params.id, 10);
  
  if (isNaN(internshipId)) {
    return {
      title: 'Internship Not Found',
    };
  }

  try {
    const internshipDetails = await getInternshipPostingWithStatus(internshipId);
    
    return {
      title: internshipDetails?.title || 'Internship Posting',
      description: internshipDetails?.description?.substring(0, 160) || 'View internship details and apply',
    };
  } catch {
    return {
      title: 'Internship Posting',
    };
  }
}
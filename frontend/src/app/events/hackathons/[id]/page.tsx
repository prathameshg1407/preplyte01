// src/app/events/hackathons/[id]/page.tsx
import { getHackathonPostingWithStatus } from "@/lib/api/event.client";
import EventDetailsView from "@/components/events/EventDetailsView";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";

/**
 * Server Component to pre-fetch details for a single hackathon posting.
 */
export default async function HackathonDetailPage({ params }: { params: { id: string } }) {
  const hackathonId = parseInt(params.id, 10);

  if (isNaN(hackathonId)) {
    notFound();
  }

  try {
    const hackathonDetails = await getHackathonPostingWithStatus(hackathonId);

    if (!hackathonDetails) {
      notFound();
    }

    const serializableHackathonDetails = JSON.parse(JSON.stringify(hackathonDetails));

    return (
      <EventDetailsView 
        initialEventDetails={serializableHackathonDetails} 
        eventType="hackathon" 
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
  const hackathonId = parseInt(params.id, 10);
  
  if (isNaN(hackathonId)) {
    return {
      title: 'Hackathon Not Found',
    };
  }

  try {
    const hackathonDetails = await getHackathonPostingWithStatus(hackathonId);
    
    return {
      title: hackathonDetails?.title || 'Hackathon Event',
      description: hackathonDetails?.description?.substring(0, 160) || 'View hackathon details and register',
    };
  } catch {
    return {
      title: 'Hackathon Event',
    };
  }
}
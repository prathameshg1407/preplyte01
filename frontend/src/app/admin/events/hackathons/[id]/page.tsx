// src/app/admin/events/hackathons/[id]/page.tsx
import { getHackathonRegistrants, getHackathonPostingWithStatus } from "@/lib/api/event.client";
import EventApplicantsView from "@/components/admin/events/EventApplicantsView";

export default async function HackathonRegistrantsPage({ params }: { params: { id: string } }) {
    const hackathonId = parseInt(params.id, 10);

    // Fetch both the registrants and hackathon details in parallel
    const [applicantsData, hackathonDetails] = await Promise.all([
        getHackathonRegistrants(hackathonId),
        getHackathonPostingWithStatus(hackathonId)
    ]);
    
    return (
        <EventApplicantsView 
            eventDetails={hackathonDetails} 
            applicantsData={applicantsData} 
            eventType="hackathon" 
        />
    );
}

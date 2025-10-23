// src/app/admin/events/internships/[id]/page.tsx
import { getInternshipApplicants, getInternshipPostingWithStatus } from "@/lib/api/event.client";
import EventApplicantsView from "@/components/admin/events/EventApplicantsView";

export default async function InternshipApplicantsPage({ params }: { params: { id: string } }) {
    const internshipId = parseInt(params.id, 10);
    
    // Fetch both the applicants and internship details in parallel
    const [applicantsData, internshipDetails] = await Promise.all([
        getInternshipApplicants(internshipId),
        getInternshipPostingWithStatus(internshipId)
    ]);
    
    return (
        <EventApplicantsView 
            eventDetails={internshipDetails} 
            applicantsData={applicantsData} 
            eventType="internship" 
        />
    );
}

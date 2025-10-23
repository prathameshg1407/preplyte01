// src/app/admin/events/jobs/[id]/page.tsx
import { getJobApplicants, getJobPostingWithStatus } from "@/lib/api/event.client";
import EventApplicantsView from "@/components/admin/events/EventApplicantsView";

export default async function JobApplicantsPage({ params }: { params: { id: string } }) {
    const jobId = parseInt(params.id, 10);
    
    // Fetch both the applicants and job details in parallel
    const [applicantsData, jobDetails] = await Promise.all([
        getJobApplicants(jobId),
        getJobPostingWithStatus(jobId)
    ]);
    
    return (
        <EventApplicantsView 
            eventDetails={jobDetails} 
            applicantsData={applicantsData} 
            eventType="job" 
        />
    );
}

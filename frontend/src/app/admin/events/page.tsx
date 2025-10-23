// src/app/admin/events/page.tsx
import EventDashboard from "@/components/admin/events/EventDashboard";
import { getPostingsForUser } from "@/lib/api/event.server";

export default async function AdminEventsPage() {
    try {
        const postings = await getPostingsForUser(); 
        return <EventDashboard initialPostings={postings} />;
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold">Error Loading Events</h1>
                <p className="text-red-500">Failed to load event postings. Please check backend.</p>
                <pre className="mt-4 p-4 bg-gray-100 rounded">
                    {JSON.stringify(error, null, 2)}
                </pre>
            </div>
        );
    }
}
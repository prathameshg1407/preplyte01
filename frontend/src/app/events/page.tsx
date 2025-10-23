// src/app/events/page.tsx
import { getPostingsForUser } from "@/lib/api/event.server";
import EventBrowser from "@/components/events/EventBrowser";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Server Component to pre-fetch all event postings for the student's institution.
 */
export default async function EventsPage() {
  try {
    const postings = await getPostingsForUser();
    return <EventBrowser initialPostings={postings} />;
  } catch (error) {
    return (
        <div className="container mx-auto p-8">
            <Card>
                <CardContent className="p-6 text-center text-destructive">
                    <p className="font-semibold">Could not load events.</p>
                    <p className="text-sm">Please try refreshing the page.</p>
                </CardContent>
            </Card>
        </div>
    );
  }
}

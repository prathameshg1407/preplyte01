'use client';

import { useState } from 'react';
import { JobPosting, InternshipPosting, HackathonPosting } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, School, Code, Calendar, Check, Loader2, MapPin, Target } from 'lucide-react';
import { applyForJob, applyForInternship, registerForHackathon } from '@/lib/api/event.client';
import { toast } from 'sonner';

type EventPosting = (JobPosting | InternshipPosting | HackathonPosting) & {
  applicationStatus?: string | null;
  registrationStatus?: string | null;
};

interface EventDetailsViewProps {
  initialEventDetails: EventPosting;
  eventType: 'job' | 'internship' | 'hackathon';
}

const ICONS = {
  job: Briefcase,
  internship: School,
  hackathon: Code,
};

export default function EventDetailsView({
  initialEventDetails,
  eventType,
}: EventDetailsViewProps) {
  const [event, setEvent] = useState(initialEventDetails);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      let successMessage = '';
      switch (eventType) {
        case 'job':
          await applyForJob(event.id);
          setEvent((prev) => ({ ...prev, applicationStatus: 'PENDING' }));
          successMessage = 'Successfully applied for job!';
          break;
        case 'internship':
          await applyForInternship(event.id);
          setEvent((prev) => ({ ...prev, applicationStatus: 'PENDING' }));
          successMessage = 'Successfully applied for internship!';
          break;
        case 'hackathon':
          await registerForHackathon(event.id);
          setEvent((prev) => ({ ...prev, registrationStatus: 'REGISTERED' }));
          successMessage = 'Successfully registered for hackathon!';
          break;
      }
      toast.success(successMessage, {
        description: `Your submission for "${event.title}" has been received.`,
      });
    } catch (error: any) {
      toast.error('Submission Failed', {
        description: error.message || 'Could not complete your submission.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const EventIcon = ICONS[eventType];
  const applicationStatus =
    event.applicationStatus || event.registrationStatus;
  const deadline =
    'applicationDeadline' in event
      ? event.applicationDeadline
      : 'registrationDeadline' in event
      ? event.registrationDeadline
      : null;

  const deadlineLabel = eventType === 'hackathon' ? 'Register by' : 'Apply by';
  const applyButtonText =
    eventType === 'hackathon'
      ? 'Register for Hackathon'
      : `Apply for this ${eventType}`;
  const appliedButtonText =
    eventType === 'hackathon'
      ? `Registered (${applicationStatus})`
      : `Applied (${applicationStatus})`;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start gap-4">
            <EventIcon className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-4xl font-bold">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-muted-foreground">
                {event.location && (
                  <p className="flex items-center gap-2">
                    <MapPin size={16} /> {event.location}
                  </p>
                )}
                {deadline && (
                  <p className="flex items-center gap-2">
                    <Calendar size={16} /> {deadlineLabel}{' '}
                    {new Date(deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <p>{event.description}</p>
              </CardContent>
            </Card>

            {event.eligibilityCriteria && (
              <Card>
                <CardHeader>
                  <CardTitle>Eligibility Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {event.eligibilityCriteria.minSscPercentage && (
                      <li>
                        SSC Percentage: {event.eligibilityCriteria.minSscPercentage}%
                        or more
                      </li>
                    )}
                    {event.eligibilityCriteria.minHscPercentage && (
                      <li>
                        HSC Percentage: {event.eligibilityCriteria.minHscPercentage}%
                        or more
                      </li>
                    )}
                    {event.eligibilityCriteria.minAverageCgpa && (
                      <li>
                        Average CGPA: {event.eligibilityCriteria.minAverageCgpa} or
                        more
                      </li>
                    )}
                    {event.eligibilityCriteria.graduationYears && (
                      <li>
                        Graduation Year:{' '}
                        {event.eligibilityCriteria.graduationYears.join(', ')}
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Submit Application</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationStatus ? (
                  <Button className="w-full" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    {appliedButtonText}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Target className="mr-2 h-4 w-4" />
                    )}
                    {applyButtonText}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

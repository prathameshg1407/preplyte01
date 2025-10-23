'use client';

import Link from 'next/link';
import { JobPosting, InternshipPosting, HackathonPosting } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, School, Code, Calendar, MapPin } from 'lucide-react';

interface EventBrowserProps {
  initialPostings: {
    jobs: JobPosting[];
    internships: InternshipPosting[];
    hackathons: HackathonPosting[];
  };
}

const JobCard = ({ post }: { post: JobPosting }) => (
    <Link href={`/events/jobs/${post.id}`} className="block group">
        <Card className="h-full flex flex-col hover:border-primary transition-all duration-200">
            <CardHeader>
                <CardTitle className="flex items-start gap-3">
                    <Briefcase className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="group-hover:text-primary transition-colors">{post.title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                {post.location && <p className="flex items-center gap-2"><MapPin size={14} /> {post.location}</p>}
                {post.salary && <p><strong>Salary:</strong> {post.salary}</p>}
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground flex items-center gap-2 w-full">
                    <Calendar size={14} /> 
                    Apply by: {post.applicationDeadline ? new Date(post.applicationDeadline).toLocaleDateString() : 'N/A'}
                </p>
            </CardFooter>
        </Card>
    </Link>
);

const InternshipCard = ({ post }: { post: InternshipPosting }) => (
    <Link href={`/events/internships/${post.id}`} className="block group">
        <Card className="h-full flex flex-col hover:border-primary transition-all duration-200">
            <CardHeader>
                <CardTitle className="flex items-start gap-3">
                    <School className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="group-hover:text-primary transition-colors">{post.title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                {post.location && <p className="flex items-center gap-2"><MapPin size={14} /> {post.location}</p>}
                {post.stipend && <p><strong>Stipend:</strong> {post.stipend}</p>}
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground flex items-center gap-2 w-full">
                    <Calendar size={14} /> 
                    Apply by: {post.applicationDeadline ? new Date(post.applicationDeadline).toLocaleDateString() : 'N/A'}
                </p>
            </CardFooter>
        </Card>
    </Link>
);

const HackathonCard = ({ post }: { post: HackathonPosting }) => (
    <Link href={`/events/hackathons/${post.id}`} className="block group">
        <Card className="h-full flex flex-col hover:border-primary transition-all duration-200">
            <CardHeader>
                <CardTitle className="flex items-start gap-3">
                    <Code className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span className="group-hover:text-primary transition-colors">{post.title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                {post.location && <p className="flex items-center gap-2"><MapPin size={14} /> {post.location}</p>}
                {post.prizes && <p><strong>Prizes:</strong> {post.prizes}</p>}
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground flex items-center gap-2 w-full">
                    <Calendar size={14} /> 
                    Register by: {post.registrationDeadline ? new Date(post.registrationDeadline).toLocaleDateString() : 'N/A'}
                </p>
            </CardFooter>
        </Card>
    </Link>
);

export default function EventBrowser({ initialPostings }: EventBrowserProps) {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Events & Opportunities</h1>
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">Jobs ({initialPostings.jobs.length})</TabsTrigger>
          <TabsTrigger value="internships">Internships ({initialPostings.internships.length})</TabsTrigger>
          <TabsTrigger value="hackathons">Hackathons ({initialPostings.hackathons.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
            {initialPostings.jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialPostings.jobs.map(job => <JobCard key={`job-${job.id}`} post={job} />)}
                </div>
            ) : <p className="text-center text-muted-foreground py-10">No job opportunities currently available.</p>}
        </TabsContent>

        <TabsContent value="internships" className="mt-6">
            {initialPostings.internships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialPostings.internships.map(internship => <InternshipCard key={`internship-${internship.id}`} post={internship} />)}
                </div>
            ) : <p className="text-center text-muted-foreground py-10">No internship opportunities currently available.</p>}
        </TabsContent>

        <TabsContent value="hackathons" className="mt-6">
            {initialPostings.hackathons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialPostings.hackathons.map(hackathon => <HackathonCard key={`hackathon-${hackathon.id}`} post={hackathon} />)}
                </div>
            ) : <p className="text-center text-muted-foreground py-10">No hackathon events currently available.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

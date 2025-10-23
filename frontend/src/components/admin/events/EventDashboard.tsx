// src/components/admin/events/EventDashboard.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { JobPosting, InternshipPosting, HackathonPosting } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Briefcase, 
  School, 
  Code, 
  Search, 
  Users,
  Calendar,
  TrendingUp,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MapPin
} from 'lucide-react';
import CreateEventModal from './CreateEventModal';

type EventType = 'job' | 'internship' | 'hackathon';
type EventPosting = JobPosting | InternshipPosting | HackathonPosting;

interface EventDashboardProps {
  initialPostings: {
    jobs: JobPosting[];
    internships: InternshipPosting[];
    hackathons: HackathonPosting[];
  };
}

export default function EventDashboard({ initialPostings }: EventDashboardProps) {
  const [postings, setPostings] = useState(initialPostings);
  const [modalType, setModalType] = useState<EventType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'jobs' | 'internships' | 'hackathons'>('jobs');

  // Calculate stats
  const stats = useMemo(() => {
    const totalJobs = postings.jobs.length;
    const totalInternships = postings.internships.length;
    const totalHackathons = postings.hackathons.length;
    
    return {
      totalJobs,
      totalInternships,
      totalHackathons,
      totalEvents: totalJobs + totalInternships + totalHackathons,
    };
  }, [postings]);

  // Filter postings based on search
  const filteredPostings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    return {
      jobs: postings.jobs.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query)
      ),
      internships: postings.internships.filter(internship =>
        internship.title.toLowerCase().includes(query) ||
        internship.description.toLowerCase().includes(query) ||
        internship.location?.toLowerCase().includes(query)
      ),
      hackathons: postings.hackathons.filter(hackathon =>
        hackathon.title.toLowerCase().includes(query) ||
        hackathon.description.toLowerCase().includes(query) ||
        hackathon.location?.toLowerCase().includes(query)
      ),
    };
  }, [postings, searchQuery]);

  const onPostingCreated = (newEvent: EventPosting, type: EventType) => {
    if (type === 'job') {
      setPostings(prev => ({ ...prev, jobs: [newEvent as JobPosting, ...prev.jobs] }));
    } else if (type === 'internship') {
      setPostings(prev => ({ ...prev, internships: [newEvent as InternshipPosting, ...prev.internships] }));
    } else if (type === 'hackathon') {
      setPostings(prev => ({ ...prev, hackathons: [newEvent as HackathonPosting, ...prev.hackathons] }));
    }
    setModalType(null);
  };

  const getEventStatus = (event: EventPosting) => {
    const now = new Date();
    let deadline: Date | null = null;

    if ('applicationDeadline' in event && event.applicationDeadline) {
      deadline = new Date(event.applicationDeadline);
    } else if ('registrationDeadline' in event && event.registrationDeadline) {
      deadline = new Date(event.registrationDeadline);
    } else if ('endDate' in event && event.endDate) {
      deadline = new Date(event.endDate);
    }

    if (!deadline) {
      return { label: 'No Deadline', variant: 'secondary' as const };
    }
    
    if (deadline < now) {
      return { label: 'Expired', variant: 'secondary' as const };
    }
    
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return { label: 'Closing Soon', variant: 'destructive' as const };
    }
    
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage job postings, internships, and hackathon events
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Event
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setModalType('job')}>
                <Briefcase className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">Job Posting</span>
                  <span className="text-xs text-muted-foreground">Full-time or part-time positions</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setModalType('internship')}>
                <School className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">Internship Posting</span>
                  <span className="text-xs text-muted-foreground">Student opportunities</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setModalType('hackathon')}>
                <Code className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">Hackathon Event</span>
                  <span className="text-xs text-muted-foreground">Coding competitions</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">All active postings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Postings</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">Active job listings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Internships</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInternships}</div>
              <p className="text-xs text-muted-foreground">Active opportunities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hackathons</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHackathons}</div>
              <p className="text-xs text-muted-foreground">Upcoming events</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
              <Badge variant="secondary" className="ml-1">{filteredPostings.jobs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="internships" className="gap-2">
              <School className="h-4 w-4" />
              <span className="hidden sm:inline">Internships</span>
              <Badge variant="secondary" className="ml-1">{filteredPostings.internships.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="hackathons" className="gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Hackathons</span>
              <Badge variant="secondary" className="ml-1">{filteredPostings.hackathons.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="mt-6">
            {filteredPostings.jobs.length > 0 ? (
              <div className="grid gap-4">
                {filteredPostings.jobs.map(job => (
                  <EventCard
                    key={job.id}
                    event={job}
                    type="job"
                    href={`/admin/events/jobs/${job.id}`}
                    status={getEventStatus(job)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No job postings found"
                description={searchQuery ? "Try adjusting your search query" : "Get started by creating your first job posting"}
                action={!searchQuery ? (
                  <Button onClick={() => setModalType('job')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Job Posting
                  </Button>
                ) : undefined}
              />
            )}
          </TabsContent>

          {/* Internships Tab */}
          <TabsContent value="internships" className="mt-6">
            {filteredPostings.internships.length > 0 ? (
              <div className="grid gap-4">
                {filteredPostings.internships.map(internship => (
                  <EventCard
                    key={internship.id}
                    event={internship}
                    type="internship"
                    href={`/admin/events/internships/${internship.id}`}
                    status={getEventStatus(internship)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={School}
                title="No internship postings found"
                description={searchQuery ? "Try adjusting your search query" : "Get started by creating your first internship posting"}
                action={!searchQuery ? (
                  <Button onClick={() => setModalType('internship')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Internship Posting
                  </Button>
                ) : undefined}
              />
            )}
          </TabsContent>

          {/* Hackathons Tab */}
          <TabsContent value="hackathons" className="mt-6">
            {filteredPostings.hackathons.length > 0 ? (
              <div className="grid gap-4">
                {filteredPostings.hackathons.map(hackathon => (
                  <EventCard
                    key={hackathon.id}
                    event={hackathon}
                    type="hackathon"
                    href={`/admin/events/hackathons/${hackathon.id}`}
                    status={getEventStatus(hackathon)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Code}
                title="No hackathon events found"
                description={searchQuery ? "Try adjusting your search query" : "Get started by creating your first hackathon event"}
                action={!searchQuery ? (
                  <Button onClick={() => setModalType('hackathon')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Hackathon Event
                  </Button>
                ) : undefined}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {modalType && (
        <CreateEventModal 
          type={modalType}
          onClose={() => setModalType(null)} 
          onSuccess={onPostingCreated} 
        />
      )}
    </>
  );
}

// Event Card Component
interface EventCardProps {
  event: JobPosting | InternshipPosting | HackathonPosting;
  type: EventType;
  href: string;
  status: { label: string; variant: 'default' | 'secondary' | 'destructive' };
}

function EventCard({ event, type, href, status }: EventCardProps) {
  const icon = type === 'job' ? Briefcase : type === 'internship' ? School : Code;
  const Icon = icon;
  
  const getEventDetails = () => {
    if (type === 'job') {
      const job = event as JobPosting;
      return {
        subtitle: job.salary || 'Salary not specified',
        location: job.location || 'Location not specified',
        deadline: job.applicationDeadline,
        applicants: job._count?.applications || 0,
      };
    } else if (type === 'internship') {
      const internship = event as InternshipPosting;
      return {
        subtitle: internship.stipend || 'Stipend not specified',
        location: internship.location || 'Location not specified',
        deadline: internship.applicationDeadline,
        applicants: internship._count?.applications || 0,
      };
    } else {
      const hackathon = event as HackathonPosting;
      return {
        subtitle: hackathon.startDate 
          ? `Starts ${new Date(hackathon.startDate).toLocaleDateString()}`
          : 'Date TBA',
        location: hackathon.location || 'Location not specified',
        deadline: hackathon.registrationDeadline,
        applicants: hackathon._count?.registrations || 0,
      };
    }
  };

  const details = getEventDetails();
  
  const getDaysUntil = () => {
    if (!details.deadline) return null;
    const daysUntil = Math.ceil(
      (new Date(details.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil;
  };

  const daysUntil = getDaysUntil();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link href={href} className="group">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                    {event.title}
                  </h3>
                </Link>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="truncate">{details.subtitle}</p>
                
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {details.location}
                  </span>
                  {daysUntil !== null && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {daysUntil > 0 ? `${daysUntil} days left` : 'Expired'}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {details.applicants} {type === 'hackathon' ? 'registered' : 'applicants'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={href} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
// src/components/admin/events/EventApplicantsView.tsx
'use client';

import { useState, useMemo } from 'react';
import { AppUser, EventApplicantsResponse, JobPosting, InternshipPosting, HackathonPosting } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Search, 
  Download, 
  Mail, 
  Phone,
  Calendar,
  GraduationCap,
  TrendingUp,
  Users,
  UserCheck,
  Filter,
  ArrowUpDown,
  Eye,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Extended type for profile with missing fields
type ExtendedProfile = {
  prn?: string | null;
  branch?: string | null;
  contactInfo?: {
    phone?: string | null;
    alternateEmail?: string | null;
    address?: string | null;
  } | null;
} & AppUser['profile'];

type ExtendedAppUser = Omit<AppUser, 'profile'> & {
  profile?: ExtendedProfile | null;
};

type EventDetails = JobPosting | InternshipPosting | HackathonPosting;
type SortField = 'name' | 'email' | 'cgpa' | 'graduationYear' | 'applicationDate';
type SortOrder = 'asc' | 'desc';

interface StudentListProps {
  students: ExtendedAppUser[];
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  filterYear: string;
  eventType: 'job' | 'internship' | 'hackathon';
  showEligibility?: boolean;
}

const StudentList = ({ 
  students, 
  searchQuery, 
  sortField, 
  sortOrder, 
  filterYear,
  eventType,
  showEligibility = false 
}: StudentListProps) => {
  // Filter and sort students
  const processedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      const matchesSearch = 
        student.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.profile?.prn?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesYear = !filterYear || 
        student.profile?.graduationYear?.toString() === filterYear;
      
      return matchesSearch && matchesYear;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.profile?.fullName || a.email;
          bValue = b.profile?.fullName || b.email;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'cgpa':
          aValue = a.profile?.averageCgpa || 0;
          bValue = b.profile?.averageCgpa || 0;
          break;
        case 'graduationYear':
          aValue = a.profile?.graduationYear || 0;
          bValue = b.profile?.graduationYear || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchQuery, sortField, sortOrder, filterYear]);

  if (processedStudents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No students found</h3>
        <p className="text-sm text-muted-foreground">
          {searchQuery || filterYear 
            ? "Try adjusting your search or filter criteria" 
            : "No students to display in this category"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {processedStudents.map((student, index) => (
        <StudentCard 
          key={student.id} 
          student={student} 
          index={index}
          showEligibility={showEligibility}
        />
      ))}
    </div>
  );
};

interface StudentCardProps {
  student: ExtendedAppUser;
  index: number;
  showEligibility?: boolean;
}

const StudentCard = ({ student, index, showEligibility }: StudentCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getEligibilityStatus = () => {
    // This is a placeholder - you can implement actual eligibility checking logic
    return {
      eligible: true,
      reasons: [] as string[]
    };
  };

  const eligibility = showEligibility ? getEligibilityStatus() : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.profile?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {student.profile?.fullName ? getInitials(student.profile.fullName) : <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg truncate">
                  {student.profile?.fullName || 'No Name'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">{student.email}</span>
                  {student.profile?.prn && (
                    <>
                      <span>•</span>
                      <span>PRN: {student.profile.prn}</span>
                    </>
                  )}
                </div>
              </div>
              
              {showEligibility && eligibility && (
                <Badge variant={eligibility.eligible ? "default" : "destructive"}>
                  {eligibility.eligible ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Eligible
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Eligible
                    </>
                  )}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              {student.profile?.averageCgpa !== undefined && student.profile?.averageCgpa !== null && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">CGPA</p>
                    <p className="font-semibold">
                      {student.profile.averageCgpa.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {student.profile?.graduationYear && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Grad Year</p>
                    <p className="font-semibold">
                      {student.profile.graduationYear}
                    </p>
                  </div>
                </div>
              )}

              {student.profile?.contactInfo?.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-semibold text-sm truncate">
                      {student.profile.contactInfo.phone}
                    </p>
                  </div>
                </div>
              )}

              {student.profile?.branch && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="font-semibold text-sm truncate">
                      {student.profile.branch}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Academic Info Section */}
            {(student.profile?.sscPercentage || student.profile?.hscPercentage || student.profile?.diplomaPercentage) && (
              <div className="flex gap-4 mt-3 pt-3 border-t text-sm">
                {student.profile.sscPercentage && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">SSC:</span>
                    <span className="font-medium">
                      {student.profile.sscPercentage}%
                    </span>
                  </div>
                )}
                {student.profile.hscPercentage && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">HSC:</span>
                    <span className="font-medium">
                      {student.profile.hscPercentage}%
                    </span>
                  </div>
                )}
                {student.profile.diplomaPercentage && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Diploma:</span>
                    <span className="font-medium">
                      {student.profile.diplomaPercentage}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(student.email);
                toast.success('Email copied to clipboard');
              }}>
                <Mail className="mr-2 h-4 w-4" />
                Copy Email
              </DropdownMenuItem>
              {student.profile?.contactInfo?.phone && (
                <DropdownMenuItem onClick={() => {
                  if (student.profile?.contactInfo?.phone) {
                    navigator.clipboard.writeText(student.profile.contactInfo.phone);
                    toast.success('Phone copied to clipboard');
                  }
                }}>
                  <Phone className="mr-2 h-4 w-4" />
                  Copy Phone
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

interface EventApplicantsViewProps {
  eventDetails: EventDetails;
  applicantsData: EventApplicantsResponse;
  eventType: 'job' | 'internship' | 'hackathon';
}

export default function EventApplicantsView({ eventDetails, applicantsData, eventType }: EventApplicantsViewProps) {
  const { registered, eligibleButNotRegistered } = applicantsData;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterYear, setFilterYear] = useState('');
  const [activeTab, setActiveTab] = useState<'applicants' | 'eligible'>('applicants');

  // Cast to extended type
  const extendedRegistered = registered as ExtendedAppUser[];
  const extendedEligible = eligibleButNotRegistered as ExtendedAppUser[];

  const applicantTerm = eventType === 'hackathon' ? 'Registrants' : 'Applicants';
  const eligibleTerm = eventType === 'hackathon' ? 'Eligible but not Registered' : 'Eligible but not Applied';

  // Get unique graduation years
  const graduationYears = useMemo(() => {
    const years = new Set<string>();
    [...extendedRegistered, ...extendedEligible].forEach(student => {
      if (student.profile?.graduationYear) {
        years.add(student.profile.graduationYear.toString());
      }
    });
    return Array.from(years).sort();
  }, [extendedRegistered, extendedEligible]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalApplicants = extendedRegistered.length;
    const totalEligible = extendedEligible.length;
    const avgCgpa = extendedRegistered.reduce((sum, student) => 
      sum + (student.profile?.averageCgpa || 0), 0) / (totalApplicants || 1);
    
    return {
      totalApplicants,
      totalEligible,
      totalStudents: totalApplicants + totalEligible,
      avgCgpa: avgCgpa.toFixed(2),
      applicationRate: totalEligible > 0 
        ? ((totalApplicants / (totalApplicants + totalEligible)) * 100).toFixed(1)
        : '100',
    };
  }, [extendedRegistered, extendedEligible]);

  const handleExport = () => {
    const students = activeTab === 'applicants' ? extendedRegistered : extendedEligible;
    
    // Create CSV content
    const headers = ['Name', 'Email', 'PRN', 'CGPA', 'Graduation Year', 'Branch', 'Phone'];
    const rows = students.map(student => [
      student.profile?.fullName || '',
      student.email,
      student.profile?.prn || '',
      student.profile?.averageCgpa?.toString() || '',
      student.profile?.graduationYear?.toString() || '',
      student.profile?.branch || '',
      student.profile?.contactInfo?.phone || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventDetails.title.replace(/\s+/g, '_')}_${activeTab}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Export successful', {
      description: `${students.length} students exported to CSV`
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{eventDetails.title}</h1>
        <p className="text-muted-foreground mt-1">
          Manage and review {applicantTerm.toLowerCase()} for this event
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total {applicantTerm}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
            <p className="text-xs text-muted-foreground">
              Registered for this event
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEligible}</div>
            <p className="text-xs text-muted-foreground">
              Haven't applied yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Application Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applicationRate}%</div>
            <p className="text-xs text-muted-foreground">
              Of eligible students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CGPA</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCgpa}</div>
            <p className="text-xs text-muted-foreground">
              Of applicants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or PRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {graduationYears.map(year => (
                  <SelectItem key={year} value={year}>
                    Graduating {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleSort('name')}>
                  Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('email')}>
                  Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('cgpa')}>
                  CGPA {sortField === 'cgpa' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('graduationYear')}>
                  Graduation Year {sortField === 'graduationYear' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applicants" className="gap-2">
            <UserCheck className="h-4 w-4" />
            {applicantTerm}
            <Badge variant="secondary" className="ml-1">{extendedRegistered.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="eligible" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            {eligibleTerm}
            <Badge variant="secondary" className="ml-1">{extendedEligible.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applicants" className="mt-6">
          <StudentList 
            students={extendedRegistered} 
            searchQuery={searchQuery}
            sortField={sortField}
            sortOrder={sortOrder}
            filterYear={filterYear}
            eventType={eventType}
          />
        </TabsContent>

        <TabsContent value="eligible" className="mt-6">
          <StudentList 
            students={extendedEligible} 
            searchQuery={searchQuery}
            sortField={sortField}
            sortOrder={sortOrder}
            filterYear={filterYear}
            eventType={eventType}
            showEligibility={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
// app/find-colleges/[collegeId]/page.tsx

import {
    MapPin,
    Search,
    BookOpen,
    Award,
    KeyRound,
    Banknote,
    ChevronRight,
    Sparkles,
    Clock,
    Users,
    TrendingUp,
    GraduationCap,
  } from 'lucide-react';
  import { Button } from '@/components/ui/button';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
  import { Checkbox } from '@/components/ui/checkbox';
  import { Label } from '@/components/ui/label';
  import { Input } from '@/components/ui/input';
  import { colleges } from '@/lib/sihmockData';
  
  // Reusable component for gradient icons
  const FeatureIcon = ({ icon: Icon, color }: { icon: any; color: string }) => (
    <div
      className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg`}
    >
      <Icon className="w-6 h-6 text-white" />
    </div>
  );
  
  export async function generateStaticParams() {
    return colleges.map((college) => ({
      collegeId: college.slug,
    }));
  }
  
  export default function CollegeDetailsPage({ params }: { params: { collegeId: string } }) {
    const college = colleges.find((c) => c.slug === params.collegeId);
  
    if (!college) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
            <p className="text-xl text-muted-foreground">College Not Found</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section with Gradient Background */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-[0.02]"></div>
          
          <div className="container relative mx-auto px-4 py-12 sm:py-16">
            {/* Breadcrumbs */}
            <nav className="mb-8 text-sm text-muted-foreground">
              <ol className="flex items-center space-x-2">
                <li>Home</li>
                <li className="text-muted-foreground/50">/</li>
                <li>Colleges</li>
                <li className="text-muted-foreground/50">/</li>
                <li className="font-medium text-foreground">{college.name}</li>
              </ol>
            </nav>
  
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Sidebar: Quick Filters */}
              <aside className="lg:col-span-1">
                <div className="bg-card border border-border rounded-2xl p-6 sticky top-24 shadow-sm">
                  <h3 className="font-display text-xl font-semibold mb-6">
                    Quick Filters
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="search-colleges" className="font-medium">
                        Search Colleges
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search-colleges"
                          placeholder="Search by name..."
                          className="pl-9 bg-background"
                        />
                      </div>
                    </div>
  
                    <div className="space-y-2">
                      <Label htmlFor="location" className="font-medium">Location</Label>
                      <Select>
                        <SelectTrigger id="location">
                          <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delhi">Delhi NCR</SelectItem>
                          <SelectItem value="mumbai">Mumbai</SelectItem>
                          <SelectItem value="bangalore">Bangalore</SelectItem>
                          <SelectItem value="chennai">Chennai</SelectItem>
                          <SelectItem value="pune">Pune</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
  
                    <div className="space-y-4">
                      <h4 className="font-display font-semibold text-sm">
                        Education Level
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="after-12th" />
                          <Label htmlFor="after-12th" className="text-sm font-normal">
                            Undergraduate
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="post-grad" />
                          <Label htmlFor="post-grad" className="text-sm font-normal">
                            Postgraduate
                          </Label>
                        </div>
                      </div>
                    </div>
  
                    <Button className="w-full">
                      Apply Filters
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </aside>
  
              {/* Main Content */}
              <main className="lg:col-span-3 space-y-8">
                {/* College Header */}
                <section>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-3">
                        {college.name}
                      </h1>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="font-medium">{college.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary text-sm font-semibold rounded-full px-4 py-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>NIRF #{college.nirfRank}</span>
                      </div>
                      <div className="bg-success/10 text-success text-sm font-semibold rounded-full px-4 py-2">
                        NAAC {college.naacGrade}
                      </div>
                    </div>
                  </div>
                </section>
  
                {/* Key Statistics */}
                <section>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {college.stats.map((stat, index) => (
                      <div
                        key={index}
                        className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-shadow"
                      >
                        <p className="text-2xl font-display font-bold text-primary">
                          {stat.value}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
  
                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Courses Offered */}
                  <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <FeatureIcon
                      icon={GraduationCap}
                      color="from-primary to-primary/60"
                    />
                    <h3 className="font-display text-xl font-semibold mb-4">
                      Courses Offered
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground">B.Tech Programs</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {college.courses.btech.examples}
                        </p>
                      </div>
                      <div className="border-t border-border pt-4">
                        <h4 className="font-semibold text-foreground">M.Tech Programs</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {college.courses.mtech.examples}
                        </p>
                      </div>
                    </div>
                  </div>
  
                  {/* Scholarships */}
                  <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <FeatureIcon
                      icon={Award}
                      color="from-warning to-warning/60"
                    />
                    <h3 className="font-display text-xl font-semibold mb-4">
                      Scholarships Available
                    </h3>
                    <div className="space-y-3">
                      {college.scholarships.map((s, i) => (
                        <div key={i} className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{s.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {s.eligibility}
                            </p>
                          </div>
                          <p className="font-bold text-sm text-success ml-2">
                            {s.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  {/* Entrance Exams */}
                  <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <FeatureIcon
                      icon={KeyRound}
                      color="from-info to-info/60"
                    />
                    <h3 className="font-display text-xl font-semibold mb-4">
                      Entrance Exams
                    </h3>
                    <div className="space-y-3">
                      {college.entranceExams.map((exam, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <p className="font-semibold text-foreground">{exam.name}</p>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Cutoff: </span>
                            <span className="font-bold text-primary">
                              {exam.cutoff}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  {/* Fee Structure */}
                  <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group">
                    <FeatureIcon
                      icon={Banknote}
                      color="from-success to-success/60"
                    />
                    <h3 className="font-display text-xl font-semibold mb-4">
                      Fee Structure
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-foreground">B.Tech (Annual)</p>
                        <p className="font-bold text-foreground">
                          {college.feeStructure.btech.total}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-foreground">M.Tech (Annual)</p>
                        <p className="font-bold text-foreground">
                          {college.feeStructure.mtech.total}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                  <Button size="lg" className="min-w-[200px]">
                    Apply Now
                  </Button>
                  <Button size="lg" variant="outline" className="min-w-[200px]">
                    Download Brochure
                  </Button>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }
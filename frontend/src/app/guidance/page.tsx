// app/guidance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Star, 
  Award, 
  Briefcase, 
  Clock, 
  Users, 
  ChevronRight,
  MapPin,
  Heart,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data (same as before)
const counselors = [
  {
    id: 1,
    name: "Dr. Priya Sharma",
    image: "/counselors/priya.jpg",
    designation: "Career Strategist & Educational Psychologist",
    experience: 12,
    rating: 4.9,
    reviews: 248,
    specializations: ["Engineering Careers", "Career Transitions", "Study Abroad"],
    price: 1499,
    sessions: 1200,
    location: "Delhi, India",
    availability: "Available Today",
    verified: true,
    shortBio: "PhD in Educational Psychology with expertise in helping students make informed career choices based on aptitude and market trends."
  },
  // ... rest of the counselors data
];

export default function CounselorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [specialization, setSpecialization] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [filteredCounselors, setFilteredCounselors] = useState(counselors);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  
  // Apply filters (same logic as before)
  useEffect(() => {
    let results = counselors;
    
    if (searchTerm) {
      results = results.filter(counselor => 
        counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        counselor.specializations.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        counselor.shortBio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    results = results.filter(counselor => 
      counselor.price >= priceRange[0] && counselor.price <= priceRange[1]
    );
    
    if (specialization !== 'all') {
      results = results.filter(counselor => 
        counselor.specializations.some(s => s.toLowerCase().includes(specialization.toLowerCase()))
      );
    }
    
    if (availabilityFilter === 'today') {
      results = results.filter(counselor => counselor.availability === 'Available Today');
    }
    
    if (sortBy === 'rating') {
      results = [...results].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'experience') {
      results = [...results].sort((a, b) => b.experience - a.experience);
    } else if (sortBy === 'price-low') {
      results = [...results].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      results = [...results].sort((a, b) => b.price - a.price);
    }
    
    setFilteredCounselors(results);
  }, [searchTerm, priceRange, specialization, availabilityFilter, sortBy]);

  const handleImageError = (id: number) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-[0.02]"></div>
        
        <div className="container relative mx-auto px-4 py-12 sm:py-16">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm text-muted-foreground">
            <ol className="flex items-center space-x-2">
              <li>Home</li>
              <li className="text-muted-foreground/50">/</li>
              <li className="font-medium text-foreground">Career Counselors</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar: Filters */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-display">
                    Filters
                    <Filter className="w-4 h-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search-counselors">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-counselors"
                        placeholder="Name or expertise..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Specialization */}
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Select value={specialization} onValueChange={setSpecialization}>
                      <SelectTrigger id="specialization">
                        <SelectValue placeholder="All Specializations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Specializations</SelectItem>
                        <SelectItem value="engineering">Engineering Careers</SelectItem>
                        <SelectItem value="medical">Medical Careers</SelectItem>
                        <SelectItem value="study abroad">Study Abroad</SelectItem>
                        <SelectItem value="mba">MBA Admissions</SelectItem>
                        <SelectItem value="tech">Tech Careers</SelectItem>
                        <SelectItem value="arts">Arts & Humanities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability */}
                  <div className="space-y-3">
                    <Label>Availability</Label>
                    <RadioGroup value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all-availability" />
                        <Label htmlFor="all-availability" className="font-normal cursor-pointer">
                          Any Time
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="today" id="today" />
                        <Label htmlFor="today" className="font-normal cursor-pointer">
                          Available Today
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                    <Label>
                      Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                    </Label>
                    <Slider
                      defaultValue={[0, 2000]}
                      max={2000}
                      step={100}
                      value={priceRange}
                      onValueChange={setPriceRange}
                    />
                  </div>

                  <Button className="w-full">
                    Apply Filters
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3 space-y-8">
              {/* Header */}
              <section>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-2">
                      Expert Career Counselors
                    </h1>
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{filteredCounselors.length} counselors</span> available for guidance
                    </p>
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="experience">Most Experienced</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>

              {/* Counselors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCounselors.map((counselor) => (
                  <Card key={counselor.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Counselor Image */}
                        <div className="relative h-20 w-20 flex-shrink-0">
                          {!imageError[counselor.id] ? (
                            <div className="relative h-full w-full rounded-full overflow-hidden border-2 border-border">
                              <Image
                                src={counselor.image}
                                alt={counselor.name}
                                fill
                                className="object-cover"
                                onError={() => handleImageError(counselor.id)}
                              />
                            </div>
                          ) : (
                            <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-lg font-bold text-white">
                              {getInitials(counselor.name)}
                            </div>
                          )}
                          {counselor.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1 border-2 border-card">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Counselor Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-display text-lg font-semibold text-foreground">
                                {counselor.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {counselor.designation}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm mb-3">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-warning fill-warning mr-1" />
                              <span className="font-medium">{counselor.rating}</span>
                              <span className="text-muted-foreground ml-1">({counselor.reviews})</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Briefcase className="h-4 w-4 mr-1" />
                              <span>{counselor.experience} years</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{counselor.sessions}+ sessions</span>
                            </div>
                          </div>

                          {/* Location & Availability */}
                          <div className="flex items-center gap-4 text-sm mb-3">
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{counselor.location}</span>
                            </div>
                            <Badge variant={counselor.availability === 'Available Today' ? 'default' : 'secondary'} className="text-xs">
                              {counselor.availability}
                            </Badge>
                          </div>

                          {/* Specializations */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {counselor.specializations.slice(0, 3).map((spec, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>

                          {/* Bio */}
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {counselor.shortBio}
                          </p>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-2xl font-bold text-primary">₹{counselor.price}</span>
                              <span className="text-sm text-muted-foreground ml-1">/session</span>
                            </div>
                            <Button asChild>
                              <Link href={`/guidance/${counselor.id}`}>
                                View Profile
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredCounselors.length === 0 && (
                <Card className="p-10 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="font-display text-2xl font-bold mb-2">No Counselors Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search terms to find more results.
                  </p>
                </Card>
              )}

              {/* Pagination */}
              {filteredCounselors.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>1</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">2</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
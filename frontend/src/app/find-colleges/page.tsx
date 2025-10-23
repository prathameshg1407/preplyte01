// app/find-colleges/page.tsx
'use client';

import {
  Building2,
  IndianRupee,
  Search,
  Star,
  MapPin,
  TrendingUp,
  ChevronRight,
  Filter,
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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { colleges } from '@/lib/sihmockData';

export default function FindCollegesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-[0.02]"></div>
        
        <div className="container relative mx-auto px-4 py-12 sm:py-16">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm text-muted-foreground">
            <ol className="flex items-center space-x-2">
              <li>Home</li>
              <li className="text-muted-foreground/50">/</li>
              <li className="font-medium text-foreground">Colleges</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar: Filter Section */}
            <aside className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl font-semibold">
                    Filters
                  </h3>
                  <Filter className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="space-y-6">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search-colleges" className="font-medium">
                      Search Colleges
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-colleges"
                        placeholder="Search by name or location..."
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-medium">Location</Label>
                    <Select>
                      <SelectTrigger id="location">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="delhi">Delhi NCR</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                        <SelectItem value="pune">Pune</SelectItem>
                        <SelectItem value="hyderabad">Hyderabad</SelectItem>
                        <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Educational Level */}
                  <div className="space-y-4">
                    <h4 className="font-display font-semibold text-sm">
                      Educational Level
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="diploma" />
                        <Label htmlFor="diploma" className="text-sm font-normal cursor-pointer">
                          Diploma
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="undergraduate" defaultChecked />
                        <Label htmlFor="undergraduate" className="text-sm font-normal cursor-pointer">
                          Undergraduate
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="postgraduate" />
                        <Label htmlFor="postgraduate" className="text-sm font-normal cursor-pointer">
                          Postgraduate
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="doctorate" />
                        <Label htmlFor="doctorate" className="text-sm font-normal cursor-pointer">
                          Doctorate
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* College Type */}
                  <div className="space-y-4">
                    <h4 className="font-display font-semibold text-sm">
                      College Type
                    </h4>
                    <RadioGroup defaultValue="all">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="all" />
                          <Label htmlFor="all" className="text-sm font-normal cursor-pointer">
                            All Types
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="engineering" id="engineering" />
                          <Label htmlFor="engineering" className="text-sm font-normal cursor-pointer">
                            Engineering
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="management" id="management" />
                          <Label htmlFor="management" className="text-sm font-normal cursor-pointer">
                            Management
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medical" id="medical" />
                          <Label htmlFor="medical" className="text-sm font-normal cursor-pointer">
                            Medical
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="arts-science" id="arts-science" />
                          <Label htmlFor="arts-science" className="text-sm font-normal cursor-pointer">
                            Arts & Science
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Apply Button */}
                  <Button className="w-full">
                    Apply Filters
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Clear Filters */}
                  <Button variant="ghost" className="w-full">
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3 space-y-8">
              {/* Header */}
              <section>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-2">
                      Find Your Dream College
                    </h1>
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">1,247 colleges</span> matching your criteria
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select defaultValue="ranking">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ranking">NIRF Ranking</SelectItem>
                        <SelectItem value="fees-low">Fees: Low to High</SelectItem>
                        <SelectItem value="fees-high">Fees: High to Low</SelectItem>
                        <SelectItem value="rating">Student Rating</SelectItem>
                        <SelectItem value="placement">Placement Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">150+</p>
                    <p className="text-xs text-muted-foreground">IITs & NITs</p>
                  </div>
                  <div className="bg-success/5 border border-success/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-success">95%</p>
                    <p className="text-xs text-muted-foreground">Avg Placement</p>
                  </div>
                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-warning">500+</p>
                    <p className="text-xs text-muted-foreground">Top Recruiters</p>
                  </div>
                  <div className="bg-info/5 border border-info/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-info">₹15L</p>
                    <p className="text-xs text-muted-foreground">Avg Package</p>
                  </div>
                </div>
              </section>

              {/* Colleges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {colleges.map((college) => (
                  <div
                    key={college.slug}
                    className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {college.name}
                        </h3>
                        <div className="flex items-center text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{college.location}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Rank #{college.rank}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                        <span>{college.streams.join(', ')}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <IndianRupee className="h-4 w-4 mr-2 text-success" />
                        <span className="font-medium">{college.fees}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 mr-2 text-warning fill-warning" />
                        <span className="font-medium">NAAC Grade: {college.naac}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-6">
                      <Button asChild className="flex-1">
                        <Link href={`/find-colleges/${college.slug}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12 flex justify-center">
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
                      <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">25</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
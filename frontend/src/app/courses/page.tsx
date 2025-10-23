"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CourseCard } from "@/components/lms/course-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  BookOpen, 
  TrendingUp, 
  Clock,
  Star,
  Sparkles,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
  Award,
  Users,
  Play
} from "lucide-react"
import { mockUser, mockCourses, mockUserCourses } from "@/lib/mock-data"

const categories = [
  { id: "all", label: "All Courses", icon: Grid3x3 },
  { id: "web", label: "Web Development", icon: BookOpen },
  { id: "data", label: "Data Science", icon: TrendingUp },
  { id: "design", label: "Design", icon: Star },
  { id: "devops", label: "DevOps", icon: Award },
  { id: "mobile", label: "Mobile", icon: Play }
]

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Highest Rated" },
  { value: "progress", label: "My Progress" }
]

export default function CoursesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popular")
  const [showFilters, setShowFilters] = useState(false)

  // Get enrolled and completed counts
  const enrolledCount = mockUserCourses.length
  const completedCount = mockUserCourses.filter(uc => uc.progress === 100).length
  const inProgressCount = enrolledCount - completedCount

  // Filter courses based on search and category
  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "web" &&
        (course.title.includes("React") || course.title.includes("TypeScript") || course.title.includes("Node.js"))) ||
      (selectedCategory === "data" && course.title.includes("Python")) ||
      (selectedCategory === "design" && course.title.includes("UI/UX")) ||
      (selectedCategory === "devops" && course.title.includes("DevOps")) ||
      (selectedCategory === "mobile" && course.title.includes("Mobile"))

    return matchesSearch && matchesCategory
  })

  const handleEnroll = (courseId: string) => {
    console.log(`Enrolling in course: ${courseId}`)
    alert("Enrollment successful! Redirecting to course...")
    router.push(`/courses/${courseId}`)
  }

  const handleContinue = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  const getUserCourse = (courseId: string) => mockUserCourses.find((uc) => uc.courseId === courseId)

  const hasActiveFilters = searchQuery || selectedCategory !== "all"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <main className="container mx-auto p-6 lg:p-8 space-y-8 max-w-7xl">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Learning Management System</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Explore Courses
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover courses to advance your skills and achieve your goals
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Enrolled</p>
                  <p className="text-3xl font-bold">{enrolledCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">In Progress</p>
                  <p className="text-3xl font-bold">{inProgressCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden relative group hover:shadow-md transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-bold">{completedCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Award className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search courses by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-0 bg-muted/50 focus-visible:ring-1"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-11 w-11 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-11 w-11 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      selectedCategory === category.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Sort and Filter Row */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filteredCourses.length}</span>
                {selectedCategory === "all" ? "courses" : "courses in this category"}
              </div>
              
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm bg-transparent border-0 font-medium text-foreground focus:outline-none cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {categories.find(c => c.id === selectedCategory)?.label}
                    <button onClick={() => setSelectedCategory("all")} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                  }}
                  className="h-7 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses Grid/List */}
        {filteredCourses.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                userCourse={getUserCourse(course.id)}
                onEnroll={handleEnroll}
                onContinue={handleContinue}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-16">
              <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? `No courses match "${searchQuery}" in ${selectedCategory === "all" ? "all categories" : "this category"}`
                  : "No courses available in this category"}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
"use client"

import { useParams, useRouter } from "next/navigation"
import { CourseOverview } from "@/components/lms/course-overview"
import { ModuleCard } from "@/components/lms/module-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Trophy,
  Sparkles,
  TrendingUp,
  Target,
  Clock
} from "lucide-react"
import {
  mockUser,
  getCourseById,
  getModulesByCourseId,
  getUserCourseProgress,
  getUserModuleProgress,
  isModuleUnlocked,
} from "@/lib/mock-data"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const course = getCourseById(courseId)
  const modules = getModulesByCourseId(courseId)
  const userCourse = getUserCourseProgress(courseId)

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <main className="container mx-auto p-6 lg:p-8">
          <Card className="border-0 shadow-lg max-w-2xl mx-auto">
            <CardContent className="text-center py-16">
              <div className="inline-flex p-4 rounded-full bg-muted mb-6">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
              <p className="text-muted-foreground mb-8 text-lg">
                The course you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push("/lms")} size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Courses
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const isEnrolled = !!userCourse
  const completedModules = modules.filter((module) => {
    const progress = getUserModuleProgress(module.id)
    return progress?.completedAt !== null
  }).length

  const handleEnroll = () => {
    console.log(`Enrolling in course: ${courseId}`)
    alert("Enrollment successful! You can now start learning.")
    window.location.reload()
  }

  const handleStartModule = (moduleId: string) => {
    router.push(`/courses/${courseId}/modules/${moduleId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <main className="container mx-auto p-6 lg:p-8 space-y-8 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/lms")}
            className="gap-2 hover:gap-3 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            All Courses
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-muted-foreground truncate">
            {course.title}
          </span>
        </div>

        {/* Progress Overview Banner (Only for enrolled users) */}
        {isEnrolled && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Overall Progress
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {userCourse.progress}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed Modules
                  </div>
                  <div className="text-3xl font-bold">
                    {completedModules}<span className="text-lg text-muted-foreground">/{modules.length}</span>
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Points Earned
                  </div>
                  <div className="text-3xl font-bold">
                    {userCourse.pointsEarned}<span className="text-lg text-muted-foreground">/{course.totalPoints}</span>
                  </div>
                </div> */}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Time Invested
                  </div>
                  <div className="text-3xl font-bold">
                    ~{Math.floor((userCourse.progress / 100) * 8)}h
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Progress value={userCourse.progress} className="h-3" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Overview Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <CourseOverview
              course={course}
              userCourse={userCourse}
              completedModules={completedModules}
              onEnroll={handleEnroll}
            />
          </div>

          {/* Modules List */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">Learning Path</span>
              </div>
              <h2 className="text-3xl font-bold">Course Modules</h2>
              <p className="text-muted-foreground text-lg">
                {isEnrolled 
                  ? "Complete modules sequentially to unlock the next one. Each module includes lessons and a test."
                  : "Enroll in this course to start your learning journey and unlock all modules."
                }
              </p>
            </div>

            {/* Module Stats */}
            {isEnrolled && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold text-primary">{completedModules}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold text-orange-500">
                        {modules.length - completedModules}
                      </div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold">{modules.length}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Modules List */}
            <div className="space-y-4">
              {modules.map((module, index) => {
                const userProgress = getUserModuleProgress(module.id)
                const unlocked = isModuleUnlocked(courseId, module.order)
                const isNextModule = index === completedModules && !userProgress?.completedAt

                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    userProgress={userProgress}
                    isUnlocked={unlocked}
                    isHighlighted={isNextModule}
                    onStartModule={handleStartModule}
                  />
                )
              })}
            </div>

            {modules.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-16">
                  <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Modules Yet</h3>
                  <p className="text-muted-foreground">
                    This course is being prepared. Modules will be added soon.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
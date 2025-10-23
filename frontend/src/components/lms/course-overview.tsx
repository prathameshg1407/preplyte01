"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Award, 
  Users, 
  Calendar, 
  Trophy,
  CheckCircle2,
  Star,
  Clock,
  Target,
  Zap,
  ArrowRight,
  Sparkles
} from "lucide-react"
import type { Course, UserCourse } from "@/lib/mock-data"
import {
  getCourseStats,
  areAllModulesCompleted,
  getMajorTestByCourseId,
  getUserMajorTestAttempt,
} from "@/lib/mock-data"

interface CourseOverviewProps {
  course: Course
  userCourse?: UserCourse
  completedModules: number
  onEnroll?: () => void
}

export function CourseOverview({ course, userCourse, completedModules, onEnroll }: CourseOverviewProps) {
  const router = useRouter()
  const isEnrolled = !!userCourse
  const isCompleted = userCourse?.completedAt !== null
  const courseStats = getCourseStats(course.id)

  const allModulesCompleted = areAllModulesCompleted(course.id)
  const majorTest = getMajorTestByCourseId(course.id)
  const majorTestAttempt = majorTest ? getUserMajorTestAttempt(majorTest.id) : null
  const canTakeMajorTest = isEnrolled && allModulesCompleted && majorTest && !majorTestAttempt

  const handleMajorTest = () => {
    router.push(`/courses/${course.id}/major-test`)
  }

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      {/* Main Course Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Course Image */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          <img
            src={course.imageUrl || "/placeholder.svg"}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          {isCompleted && (
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-green-500 text-white rounded-full p-4 shadow-lg">
                <Trophy className="h-8 w-8" />
              </div>
            </div>
          )}
          {isEnrolled && !isCompleted && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-blue-500 text-white border-0 shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Enrolled
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="space-y-3 pb-4">
          <h1 className="text-2xl font-bold leading-tight">{course.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{course.description}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                Modules
              </div>
              <div className="text-xl font-bold">{course.totalModules}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5 text-purple-500" />
                Students
              </div>
              <div className="text-xl font-bold">{courseStats.enrollments.toLocaleString()}</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Total Points
              </div>
              <div className="text-xl font-bold">{courseStats.totalPoints}</div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                Rating
              </div>
              <div className="text-xl font-bold">4.8</div>
            </div>
          </div>

          {/* Enrolled User Stats */}
          {isEnrolled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Progress</span>
                <Badge variant="secondary">
                  {completedModules}/{course.totalModules} completed
                </Badge>
              </div>

              <div className="space-y-2">
                <Progress value={userCourse.progress} className="h-2.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{userCourse.progress}% complete</span>
                  <span>{userCourse.pointsEarned} pts earned</span>
                </div>
              </div>

              <div className="space-y-2">
                {userCourse.enrolledAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Started {userCourse.enrolledAt.toLocaleDateString()}</span>
                  </div>
                )}

                {userCourse.completedAt && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed {userCourse.completedAt.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enroll Button */}
          {!isEnrolled && (
            <Button className="w-full" size="lg" onClick={onEnroll}>
              Enroll in Course
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Final Assessment Card */}
      {majorTest && isEnrolled && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
          <CardContent className="p-6 relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Final Assessment</h3>
                <p className="text-sm text-muted-foreground">Prove your mastery</p>
              </div>
            </div>

            {majorTestAttempt ? (
              <div className="space-y-3">
                <div className="bg-background/50 backdrop-blur-sm p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your Score</span>
                    <Badge 
                      variant={majorTestAttempt.totalScore >= majorTest.passingScore ? "default" : "destructive"}
                      className="text-base px-3 py-1"
                    >
                      {majorTestAttempt.totalScore}%
                    </Badge>
                  </div>
                  <Progress value={majorTestAttempt.totalScore} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Passing: {majorTest.passingScore}%
                    </span>
                    <span className={majorTestAttempt.totalScore >= majorTest.passingScore ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                      {majorTestAttempt.totalScore >= majorTest.passingScore ? "✓ Passed" : "✗ Failed"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Completed {majorTestAttempt.completedAt.toLocaleDateString()}
                </p>
              </div>
            ) : canTakeMajorTest ? (
              <div className="space-y-3">
                <div className="bg-background/50 backdrop-blur-sm p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bonus Points</span>
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      +{majorTest.pointsValue}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{majorTest.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Passing Score</span>
                    <span className="font-medium">{majorTest.passingScore}%</span>
                  </div>
                </div>
                <Button onClick={handleMajorTest} className="w-full" size="lg">
                  <Trophy className="h-4 w-4 mr-2" />
                  Start Final Assessment
                </Button>
              </div>
            ) : !allModulesCompleted ? (
              <div className="bg-background/50 backdrop-blur-sm p-4 rounded-xl text-center">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Complete all modules to unlock
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Course Info Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-3">
          <h3 className="font-semibold mb-4">Course Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Duration</span>
              </div>
              <span className="font-medium">~8 hours</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Level</span>
              </div>
              <Badge variant="outline">Beginner</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>Certificate</span>
              </div>
              <span className="font-medium">✓ Included</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
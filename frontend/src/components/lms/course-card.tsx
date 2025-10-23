"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  Award, 
  Play, 
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  Star,
  TrendingUp,
  Target
} from "lucide-react"
import Link from "next/link"
import type { Course, UserCourse } from "@/lib/mock-data"
import { getCourseStats } from "@/lib/mock-data"

interface CourseCardProps {
  course: Course
  userCourse?: UserCourse
  onEnroll?: (courseId: string) => void
  onContinue?: (courseId: string) => void
  viewMode?: "grid" | "list"
}

export function CourseCard({ 
  course, 
  userCourse, 
  onEnroll, 
  onContinue,
  viewMode = "grid" 
}: CourseCardProps) {
  const isEnrolled = !!userCourse
  const isCompleted = userCourse?.completedAt !== null
  const progress = userCourse?.progress || 0
  const courseStats = getCourseStats(course.id)

  const handleAction = () => {
    if (isEnrolled && onContinue) {
      onContinue(course.id)
    } else if (!isEnrolled && onEnroll) {
      onEnroll(course.id)
    }
  }

  // List View Layout
  if (viewMode === "list") {
    return (
      <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-0">
            {/* Image Section */}
            <div className="relative md:w-80 h-56 md:h-auto flex-shrink-0 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
              <img
                src={course.imageUrl || "/placeholder.svg"}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              
              {/* Overlay for completed */}
              {isCompleted && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-green-500 text-white rounded-full p-4 shadow-lg">
                    <CheckCircle className="h-10 w-10" />
                  </div>
                </div>
              )}

              {/* Status Badge */}
              {isEnrolled && !isCompleted && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-blue-500 text-white border-0 shadow-lg">
                    <Play className="h-3 w-3 mr-1" />
                    In Progress
                  </Badge>
                </div>
              )}

              {/* Points Badge */}
              <div className="absolute bottom-4 left-4">
                <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm shadow-lg border-0">
                  <Zap className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  <span className="font-bold">{courseStats.totalPoints}</span>
                  <span className="text-muted-foreground ml-1">pts</span>
                </Badge>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Title and Description */}
                <div>
                  <h3 className="font-bold text-2xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{course.totalModules} modules</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">~8 hours</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{courseStats.enrollments.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">4.8</span>
                  </div>
                </div>

                {/* Progress Section */}
                {isEnrolled && (
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Your Progress</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5" />
                    {userCourse && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="h-4 w-4 text-amber-500" />
                        <span>{userCourse.pointsEarned} points earned</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3 mt-6">
                {isEnrolled ? (
                  <Button 
                    onClick={handleAction}
                    size="lg"
                    className="group/btn"
                    variant={isCompleted ? "outline" : "default"}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Review Course
                        <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Continue Learning
                        <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleAction}
                    size="lg"
                    className="group/btn"
                  >
                    Enroll Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                )}

                {isCompleted && (
                  <Badge variant="secondary" className="px-4 py-2">
                    <Award className="h-4 w-4 mr-2 text-green-500" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid View Layout (Default)
  return (
    <Card className="border-0 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group flex flex-col h-full">
      {/* Image Section */}
      <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        <img
          src={course.imageUrl || "/placeholder.svg"}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
              <CheckCircle className="h-8 w-8" />
            </div>
          </div>
        )}

        {/* Status Badge */}
        {isEnrolled && !isCompleted && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-blue-500 text-white border-0 shadow-lg">
              <Play className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          </div>
        )}

        {/* Points Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm shadow-lg border-0">
            <Zap className="h-3 w-3 mr-1 text-amber-500" />
            <span className="font-bold">{courseStats.totalPoints}</span>
          </Badge>
        </div>

        {/* Difficulty Badge (bottom right) */}
        <div className="absolute bottom-3 right-3">
          <Badge variant="outline" className="bg-background/95 backdrop-blur-sm border-0 shadow-lg">
            <Target className="h-3 w-3 mr-1" />
            Beginner
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 leading-relaxed">
          {course.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2.5 py-2 rounded-lg">
            <BookOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <span className="font-medium truncate">{course.totalModules} modules</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2.5 py-2 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
            <span className="font-medium truncate">~8 hours</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2.5 py-2 rounded-lg">
            <Users className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
            <span className="font-medium truncate">{courseStats.enrollments.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2.5 py-2 rounded-lg">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            <span className="font-medium truncate">4.8 rating</span>
          </div>
        </div>

        {/* Progress Section */}
        {isEnrolled && (
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-3 rounded-lg space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Progress</span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {userCourse && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                <span>{userCourse.pointsEarned} pts earned</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-5 pt-0">
        {isEnrolled ? (
          <Button 
            onClick={handleAction}
            className="w-full group/btn"
            variant={isCompleted ? "outline" : "default"}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Review
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Continue
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleAction}
            className="w-full group/btn"
          >
            Enroll Now
            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
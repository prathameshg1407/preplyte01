"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Play, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import type { UserCourse } from "@/lib/mock-data"

interface ActiveCoursesProps {
  courses: UserCourse[]
}

export function ActiveCourses({ courses }: ActiveCoursesProps) {
  const router = useRouter()

  const handleContinue = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Active Courses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No active courses. Start learning today!</p>
        ) : (
          courses.map((userCourse) => (
            <div
              key={userCourse.id}
              className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <img
                src={userCourse.course.imageUrl || "/placeholder.svg"}
                alt={userCourse.course.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{userCourse.course.title}</h3>
                  <span className="text-sm font-medium text-primary">{userCourse.pointsEarned} pts</span>
                </div>
                <p className="text-sm text-muted-foreground">{userCourse.course.description}</p>
                <div className="flex items-center gap-2">
                  <Progress value={userCourse.progress} className="flex-1" />
                  <span className="text-sm text-muted-foreground">{userCourse.progress}%</span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => handleContinue(userCourse.course.id)}
              >
                <Play className="h-4 w-4 mr-1" />
                Continue
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

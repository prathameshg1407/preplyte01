"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Award } from "lucide-react"
import { useRouter } from "next/navigation"
import type { UserCourse } from "@/lib/mock-data"

interface CompletedCoursesProps {
  courses: UserCourse[]
}

export function CompletedCourses({ courses }: CompletedCoursesProps) {
  const router = useRouter()

  const handleReview = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-secondary" />
          Completed Courses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No completed courses yet. Keep learning!</p>
        ) : (
          courses.map((userCourse) => (
            <div
              key={userCourse.id}
              className="flex items-center gap-4 p-4 border border-border rounded-lg bg-secondary/5"
            >
              <img
                src={userCourse.course.imageUrl || "/placeholder.svg"}
                alt={userCourse.course.title}
                className="w-16 h-16 rounded-lg object-cover opacity-90"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{userCourse.course.title}</h3>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium text-secondary">{userCourse.pointsEarned} pts</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{userCourse.course.description}</p>
                {userCourse.completedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Completed on {userCourse.completedAt.toLocaleDateString()}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => handleReview(userCourse.course.id)}>
                Review
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

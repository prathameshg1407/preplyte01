"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { MajorTestInterface } from "@/components/lms/major-test-interface"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Award, Clock, AlertTriangle } from "lucide-react"
import {
  getCourseById,
  getMajorTestByCourseId,
  getUserMajorTestAttempt,
  isCodingCourse,
  areAllModulesCompleted,
} from "@/lib/mock-data"

export default function MajorTestPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const [started, setStarted] = useState(false)

  const course = getCourseById(courseId)
  const majorTest = getMajorTestByCourseId(courseId)
  const userAttempt = majorTest ? getUserMajorTestAttempt(majorTest.id) : null
  const isCodeCourse = isCodingCourse(courseId)
  const allModulesCompleted = areAllModulesCompleted(courseId)

  if (!course || !majorTest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Major test not found for this course.</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!allModulesCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Complete All Modules First
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You must complete all modules in this course before taking the major test.</p>
            <Button onClick={() => router.push(`/courses/${courseId}`)}>Return to Course</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleComplete = (mcqScore: number, codingScore: number, mcqAnswers: number[], codingSubmissions: string[]) => {
    // In a real app, this would save to database
    console.log("[v0] Major test completed:", { mcqScore, codingScore, mcqAnswers, codingSubmissions })

    // Simulate navigation after completion
    setTimeout(() => {
      router.push(`/courses/${courseId}`)
    }, 3000)
  }

  if (userAttempt || started) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push(`/courses/${courseId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>

        <MajorTestInterface
          majorTest={majorTest}
          userAttempt={userAttempt ?? undefined}
          onComplete={handleComplete}
          isCodingCourse={isCodeCourse}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push(`/courses/${courseId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            {majorTest.title}
          </CardTitle>
          <p className="text-muted-foreground">{majorTest.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold">Points Value</h4>
                <p className="text-2xl font-bold text-primary">{majorTest.pointsValue}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-secondary" />
                <h4 className="font-semibold">Passing Score</h4>
                <p className="text-2xl font-bold text-secondary">{majorTest.passingScore}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <h4 className="font-semibold">Attempts</h4>
                <p className="text-2xl font-bold text-yellow-600">1 Only</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Structure:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">MCQ Section</Badge>
                <span className="text-sm text-muted-foreground">
                  {majorTest.mcqQuestions.length} multiple choice questions
                </span>
              </div>
              {isCodeCourse && majorTest.codingChallenges && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Coding Section</Badge>
                  <span className="text-sm text-muted-foreground">
                    {majorTest.codingChallenges.length} practical coding challenge(s)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Important Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This is your final assessment for the course. You can only take this test once. Make sure you're well
                  prepared before starting.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <Button onClick={() => setStarted(true)} className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg">
              Start Major Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

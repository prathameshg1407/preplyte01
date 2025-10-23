"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
// import { DashboardHeader } from "../../../../components/dashboard-header"
import { ModuleNavigation } from "@/components/lms/module-navigation"
import { TheoryContent } from "@/components/lms/theory-content"
import { TestInterface } from "@/components/lms/test-interface"
import {
  mockUser,
  getCourseById,
  getModuleById,
  getTestByModuleId,
  getUserTestAttempt,
  getNextModule,
} from "@/lib/mock-data"

export default function ModulePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const moduleId = params.moduleId as string

  const [currentSection, setCurrentSection] = useState<"theory" | "test">("theory")

  const course = getCourseById(courseId)
  const module = getModuleById(moduleId)
  const test = getTestByModuleId(moduleId)
  const userTestAttempt = test ? getUserTestAttempt(test.id) : undefined
  const nextModule = getNextModule(courseId, moduleId)

  if (!course || !module) {
    return (
      <div className="min-h-screen bg-background">
        {/* <DashboardHeader userName={mockUser.name} userEmail={mockUser.email} /> */}
        <main className="p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Module Not Found</h1>
            <p className="text-muted-foreground mb-6">The module you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Back to Course
            </button>
          </div>
        </main>
      </div>
    )
  }

  const handleTestComplete = (score: number, answers: number[]) => {
    // In a real app, this would save the test results to the backend
    console.log("Test completed:", { score, answers, moduleId })

    // Simulate saving and show success message
    alert(
      `Test completed! Score: ${score}%. ${score >= (test?.passingScore || 70) ? "You passed!" : "You need to retake the test."}`,
    )
  }

  const handleRetakeTest = () => {
    // Reset test state for retake
    window.location.reload()
  }

  const handleBackToCourse = () => {
    // Corrected path with the /lms prefix
    router.push(`/courses/${courseId}`)
  }

  const handleSectionChange = (section: "theory" | "test") => {
    setCurrentSection(section)
  }

  const handleContinueToTest = () => {
    setCurrentSection("test")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <DashboardHeader userName={mockUser.name} userEmail={mockUser.email} /> */}

      <ModuleNavigation
        courseTitle={course.title}
        moduleTitle={module.title}
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        onBackToCourse={handleBackToCourse}
        testCompleted={!!userTestAttempt}
      />

      <main className="p-6">
        {currentSection === "theory" ? (
          <TheoryContent title={module.title} content={module.content} onContinue={handleContinueToTest} />
        ) : test ? (
          <TestInterface
            test={test}
            userAttempt={userTestAttempt}
            onComplete={handleTestComplete}
            onRetake={handleRetakeTest}
            courseId={courseId}
            currentModuleId={moduleId}
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-foreground mb-4">No Test Available</h2>
              <p className="text-muted-foreground">This module doesn't have a test yet.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

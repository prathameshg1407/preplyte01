"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Award, RotateCcw, ArrowRight } from "lucide-react"
import type { CourseTest, UserTestAttempt } from "@/lib/mock-data"
import { getNextModule } from "@/lib/mock-data"

interface TestInterfaceProps {
  test: CourseTest
  userAttempt?: UserTestAttempt
  onComplete: (score: number, answers: number[]) => void
  onRetake?: () => void
  courseId: string
  currentModuleId: string
}

export function TestInterface({
  test,
  userAttempt,
  onComplete,
  onRetake,
  courseId,
  currentModuleId,
}: TestInterfaceProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>(new Array(test.questions.length).fill(-1))
  const [showResults, setShowResults] = useState(!!userAttempt)
  const [submitted, setSubmitted] = useState(false)

  const nextModule = getNextModule(courseId, currentModuleId)

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResults) return

    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    const score = calculateScore()
    setSubmitted(true)
    setShowResults(true)
    onComplete(score, answers)
  }

  const handleNextModule = () => {
    if (nextModule) {
      router.push(`/courses/${courseId}/modules/${nextModule.id}`)
    }
  }

  const calculateScore = () => {
    const correctAnswers = answers.filter((answer, index) => answer === test.questions[index].correctAnswer).length
    return Math.round((correctAnswers / test.questions.length) * 100)
  }

  const currentQuestionData = test.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / test.questions.length) * 100
  const allAnswered = answers.every((answer) => answer !== -1)
  const finalScore = userAttempt?.score || (submitted ? calculateScore() : 0)
  const passed = finalScore >= test.passingScore

  if (showResults) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              {passed ? (
                <CheckCircle className="h-12 w-12 text-secondary" />
              ) : (
                <XCircle className="h-12 w-12 text-destructive" />
              )}
              <div>
                <h3 className="text-2xl font-bold text-foreground">{finalScore}%</h3>
                <p className="text-muted-foreground">
                  {passed ? "Congratulations! You passed!" : "You need 70% to pass"}
                </p>
              </div>
            </div>

            <Badge variant={passed ? "default" : "destructive"} className="text-sm">
              {passed ? `+${test.pointsValue} points earned` : "No points earned"}
            </Badge>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Review Answers:</h4>
            {test.questions.map((question, index) => {
              const userAnswer = userAttempt?.answers[index] ?? answers[index]
              const isCorrect = userAnswer === question.correctAnswer

              return (
                <Card
                  key={question.id}
                  className={`border-l-4 ${isCorrect ? "border-l-secondary" : "border-l-destructive"}`}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{question.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your answer: {question.options[userAnswer]}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-secondary mt-1">
                              Correct answer: {question.options[question.correctAnswer]}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex justify-center gap-4 pt-4">
            {!passed && onRetake && (
              <Button onClick={onRetake} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Test
              </Button>
            )}
            {passed && nextModule && (
              <Button onClick={handleNextModule} className="bg-primary hover:bg-primary/90">
                <ArrowRight className="h-4 w-4 mr-2" />
                Next Module: {nextModule.title}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{test.title}</CardTitle>
          <Badge variant="outline">
            Question {currentQuestion + 1} of {test.questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{currentQuestionData.question}</h3>

          <div className="space-y-3">
            {currentQuestionData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left border rounded-lg transition-colors ${
                  answers[currentQuestion] === index
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      answers[currentQuestion] === index ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}
                  >
                    {answers[currentQuestion] === index && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-border">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestion < test.questions.length - 1 ? (
              <Button onClick={handleNext} disabled={answers[currentQuestion] === -1}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!allAnswered} className="bg-primary hover:bg-primary/90">
                Submit Test
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Award, Code, BookOpen } from "lucide-react"
import { Editor } from "@monaco-editor/react"
import type { MajorTest, UserMajorTestAttempt } from "@/lib/mock-data"

interface MajorTestInterfaceProps {
  majorTest: MajorTest
  userAttempt?: UserMajorTestAttempt
  onComplete: (mcqScore: number, codingScore: number, mcqAnswers: number[], codingSubmissions: string[]) => void
  isCodingCourse: boolean
}

export function MajorTestInterface({ majorTest, userAttempt, onComplete, isCodingCourse }: MajorTestInterfaceProps) {
  const [currentMcqQuestion, setCurrentMcqQuestion] = useState(0)
  const [mcqAnswers, setMcqAnswers] = useState<number[]>(new Array(majorTest.mcqQuestions.length).fill(-1))
  const [currentCodingChallenge, setCurrentCodingChallenge] = useState(0)
  const [codingSubmissions, setCodingSubmissions] = useState<string[]>(
    majorTest.codingChallenges?.map((challenge) => challenge.starterCode) || [],
  )
  const [showResults, setShowResults] = useState(!!userAttempt)
  const [submitted, setSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState("mcq")

  const handleMcqAnswerSelect = (answerIndex: number) => {
    if (showResults) return
    const newAnswers = [...mcqAnswers]
    newAnswers[currentMcqQuestion] = answerIndex
    setMcqAnswers(newAnswers)
  }

  const handleCodeChange = (value: string | undefined) => {
    if (showResults || !majorTest.codingChallenges) return
    const newSubmissions = [...codingSubmissions]
    newSubmissions[currentCodingChallenge] = value || ""
    setCodingSubmissions(newSubmissions)
  }

  const calculateMcqScore = () => {
    const correctAnswers = mcqAnswers.filter(
      (answer, index) => answer === majorTest.mcqQuestions[index].correctAnswer,
    ).length
    return Math.round((correctAnswers / majorTest.mcqQuestions.length) * 100)
  }

  const calculateCodingScore = () => {
    // Simplified scoring - in real app, this would run actual tests
    return isCodingCourse ? 85 : 0 // Mock score for coding challenges
  }

  const handleSubmit = () => {
    const mcqScore = calculateMcqScore()
    const codingScore = calculateCodingScore()
    setSubmitted(true)
    setShowResults(true)
    onComplete(mcqScore, codingScore, mcqAnswers, codingSubmissions)
  }

  const mcqScore = userAttempt?.mcqScore || (submitted ? calculateMcqScore() : 0)
  const codingScore = userAttempt?.codingScore || (submitted ? calculateCodingScore() : 0)
  const totalScore = userAttempt?.totalScore || (submitted ? Math.round((mcqScore + codingScore) / 2) : 0)
  const passed = totalScore >= majorTest.passingScore

  const allMcqAnswered = mcqAnswers.every((answer) => answer !== -1)
  const allCodingCompleted =
    !isCodingCourse ||
    codingSubmissions.every(
      (submission) => submission.trim().length > (majorTest.codingChallenges?.[0]?.starterCode.length || 0),
    )

  if (showResults) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Major Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              {passed ? (
                <CheckCircle className="h-16 w-16 text-secondary" />
              ) : (
                <XCircle className="h-16 w-16 text-destructive" />
              )}
              <div>
                <h3 className="text-3xl font-bold text-foreground">{totalScore}%</h3>
                <p className="text-muted-foreground">
                  {passed ? "Excellent work! Course completed!" : `You need ${majorTest.passingScore}% to pass`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold">MCQ Score</h4>
                  <p className="text-2xl font-bold text-foreground">{mcqScore}%</p>
                </CardContent>
              </Card>

              {isCodingCourse && (
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Code className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold">Coding Score</h4>
                    <p className="text-2xl font-bold text-foreground">{codingScore}%</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-4 text-center">
                  <Award className="h-8 w-8 mx-auto mb-2 text-secondary" />
                  <h4 className="font-semibold">Points Earned</h4>
                  <p className="text-2xl font-bold text-secondary">{passed ? `+${majorTest.pointsValue}` : "0"}</p>
                </CardContent>
              </Card>
            </div>

            <Badge variant={passed ? "default" : "destructive"} className="text-lg px-4 py-2">
              {passed ? "Course Completed!" : "Course Not Completed"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          {majorTest.title}
        </CardTitle>
        <p className="text-muted-foreground">{majorTest.description}</p>
        <Badge variant="outline" className="w-fit">
          Final Assessment • {majorTest.pointsValue} points • One attempt only
        </Badge>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mcq" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              MCQ Section
            </TabsTrigger>
            {isCodingCourse && (
              <TabsTrigger value="coding" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Coding Section
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="mcq" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Multiple Choice Questions</h3>
              <Badge variant="outline">
                Question {currentMcqQuestion + 1} of {majorTest.mcqQuestions.length}
              </Badge>
            </div>

            <Progress value={((currentMcqQuestion + 1) / majorTest.mcqQuestions.length) * 100} />

            <div className="space-y-4">
              <h4 className="text-lg font-medium">{majorTest.mcqQuestions[currentMcqQuestion].question}</h4>

              <div className="space-y-3">
                {majorTest.mcqQuestions[currentMcqQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleMcqAnswerSelect(index)}
                    className={`w-full p-4 text-left border rounded-lg transition-colors ${
                      mcqAnswers[currentMcqQuestion] === index
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          mcqAnswers[currentMcqQuestion] === index
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {mcqAnswers[currentMcqQuestion] === index && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentMcqQuestion(Math.max(0, currentMcqQuestion - 1))}
                disabled={currentMcqQuestion === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() =>
                  setCurrentMcqQuestion(Math.min(majorTest.mcqQuestions.length - 1, currentMcqQuestion + 1))
                }
                disabled={
                  currentMcqQuestion === majorTest.mcqQuestions.length - 1 || mcqAnswers[currentMcqQuestion] === -1
                }
              >
                Next
              </Button>
            </div>
          </TabsContent>

          {isCodingCourse && majorTest.codingChallenges && (
            <TabsContent value="coding" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Coding Challenges</h3>
                <Badge variant="outline">
                  Challenge {currentCodingChallenge + 1} of {majorTest.codingChallenges.length}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium">{majorTest.codingChallenges[currentCodingChallenge].title}</h4>
                  <p className="text-muted-foreground mt-2">
                    {majorTest.codingChallenges[currentCodingChallenge].description}
                  </p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <span className="text-sm font-medium">Code Editor</span>
                  </div>
                  <Editor
                    height="400px"
                    language={majorTest.codingChallenges[currentCodingChallenge].language}
                    value={codingSubmissions[currentCodingChallenge]}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h5 className="font-medium mb-2">Test Cases:</h5>
                  {majorTest.codingChallenges[currentCodingChallenge].testCases.map((testCase, index) => (
                    <div key={index} className="text-sm space-y-1">
                      <p>
                        <strong>Test {index + 1}:</strong> {testCase.description}
                      </p>
                      <p>
                        <strong>Input:</strong> {testCase.input}
                      </p>
                      <p>
                        <strong>Expected:</strong> {testCase.expectedOutput}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-center pt-6 border-t mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!allMcqAnswered || !allCodingCompleted}
            className="bg-primary hover:bg-primary/90 px-8"
          >
            Submit Final Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

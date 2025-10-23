"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, FileText } from "lucide-react"

interface ModuleNavigationProps {
  courseTitle: string
  moduleTitle: string
  currentSection: "theory" | "test"
  onSectionChange: (section: "theory" | "test") => void
  onBackToCourse: () => void
  testCompleted?: boolean
}

export function ModuleNavigation({
  courseTitle,
  moduleTitle,
  currentSection,
  onSectionChange,
  onBackToCourse,
  testCompleted,
}: ModuleNavigationProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBackToCourse}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">{courseTitle}</p>
              <h1 className="text-xl font-bold text-foreground">{moduleTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={currentSection === "theory" ? "default" : "outline"}
              size="sm"
              onClick={() => onSectionChange("theory")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Theory
            </Button>
            <Button
              variant={currentSection === "test" ? "default" : "outline"}
              size="sm"
              onClick={() => onSectionChange("test")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Test
              {testCompleted && <Badge className="ml-2 h-4 w-4 p-0 bg-secondary">✓</Badge>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

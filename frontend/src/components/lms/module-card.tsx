"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  Lock, 
  Play, 
  Award,
  Clock,
  BookOpen,
  Target,
  Zap,
  ArrowRight,
  Sparkles
} from "lucide-react"
import type { CourseModule, UserModuleProgress } from "@/lib/mock-data"

interface ModuleCardProps {
  module: CourseModule
  userProgress?: UserModuleProgress
  isUnlocked: boolean
  isHighlighted?: boolean
  onStartModule: (moduleId: string) => void
}

export function ModuleCard({ 
  module, 
  userProgress, 
  isUnlocked, 
  isHighlighted = false,
  onStartModule 
}: ModuleCardProps) {
  const isCompleted = userProgress?.completedAt !== null
  const testScore = userProgress?.testScore

  return (
    <Card 
      className={`
        border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden
        ${!isUnlocked && 'opacity-60'}
        ${isHighlighted && isUnlocked && !isCompleted && 'ring-2 ring-primary shadow-lg'}
      `}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-0">
          {/* Left Section - Module Number & Icon */}
          <div className={`
            relative w-full sm:w-40 h-32 sm:h-auto flex items-center justify-center
            ${isCompleted 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' 
              : isUnlocked 
                ? 'bg-gradient-to-br from-primary/10 to-primary/5'
                : 'bg-gradient-to-br from-muted to-muted/50'
            }
          `}>
            <div className="text-center space-y-2">
              {isCompleted ? (
                <div className="inline-flex p-4 rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              ) : !isUnlocked ? (
                <div className="inline-flex p-4 rounded-full bg-muted">
                  <Lock className="h-10 w-10 text-muted-foreground" />
                </div>
              ) : (
                <div className="inline-flex p-4 rounded-full bg-primary/20">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
              )}
              <div className="text-sm font-bold text-muted-foreground">
                Module {module.order}
              </div>
            </div>

            {isHighlighted && isUnlocked && !isCompleted && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary text-primary-foreground border-0 shadow-md">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Next
                </Badge>
              </div>
            )}
          </div>

          {/* Right Section - Content */}
          <div className="flex-1 p-6 space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-xl leading-tight flex-1">
                  {module.title}
                </h3>
                <Badge variant="secondary" className="flex-shrink-0">
                  <Zap className="h-3 w-3 mr-1 text-amber-500" />
                  {module.pointsValue} pts
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {module.description}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>~45 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                <span>5 lessons</span>
              </div>
              {isCompleted && testScore && (
                <div className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Test: {testScore}%</span>
                </div>
              )}
            </div>

            {/* Progress Section (if in progress) */}
            {userProgress && !isCompleted && userProgress.progress && userProgress.progress > 0 && (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">In Progress</span>
                  <span className="font-bold text-primary">{userProgress.progress}%</span>
                </div>
                <Progress value={userProgress.progress} className="h-2" />
              </div>
            )}

            {/* Completed Section */}
            {isCompleted && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Completed</span>
                  </div>
                  {userProgress?.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      {userProgress.completedAt.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex gap-2 pt-2">
              {isUnlocked ? (
                <Button
                  onClick={() => onStartModule(module.id)}
                  className="group/btn"
                  variant={isCompleted ? "outline" : "default"}
                  size="lg"
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Review Module
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {userProgress?.progress ? 'Continue' : 'Start'} Module
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              ) : (
                <Button disabled size="lg" variant="ghost">
                  <Lock className="h-4 w-4 mr-2" />
                  Complete previous modules to unlock
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
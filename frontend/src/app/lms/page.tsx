'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@radix-ui/react-progress"
import { 
  Bell, 
  Settings, 
  Trophy, 
  BookOpen, 
  CheckCircle, 
  TrendingUp,
  Play,
  Clock,
  Calendar,
  Award,
  Medal
} from "lucide-react"
import { useRouter } from "next/navigation"
import { mockUser, getActiveCourses, getCompletedCourses, getTotalPointsWithMajorTests, getLeaderboard } from "@/lib/mock-data"
import type { UserCourse } from "@/lib/mock-data"
// Dashboard Header Component
interface DashboardHeaderProps {
  userName: string
  userEmail: string
}

// Stats Overview Component
interface StatsOverviewProps {
  totalPoints: number
  activeCourses: number
  completedCourses: number
  averageProgress: number
}

function StatsOverview({ totalPoints, activeCourses, completedCourses, averageProgress }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Total Points</CardTitle>
          <Trophy className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Keep learning to earn more!</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Active Courses</CardTitle>
          <BookOpen className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{activeCourses}</div>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{completedCourses}</div>
          <p className="text-xs text-muted-foreground">Courses finished</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Average Progress</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{averageProgress}%</div>
          <p className="text-xs text-muted-foreground">Across active courses</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Active Courses Component
interface ActiveCoursesProps {
  courses: UserCourse[]
}

function ActiveCourses({ courses }: ActiveCoursesProps) {
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

// Completed Courses Component
interface CompletedCoursesProps {
  courses: UserCourse[]
}

function CompletedCourses({ courses }: CompletedCoursesProps) {
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

// Leaderboard Component
function Leaderboard() {
  const leaderboard = getLeaderboard()

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboard.slice(0, 8).map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.totalPoints.toLocaleString()} points</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Main Dashboard Component
export default function Dashboard() {
  const activeCourses = getActiveCourses()
  const completedCourses = getCompletedCourses()
  const totalPoints = getTotalPointsWithMajorTests()

  // Calculate average progress for active courses
  const averageProgress =
    activeCourses.length > 0
      ? Math.round(activeCourses.reduce((sum, course) => sum + course.progress, 0) / activeCourses.length)
      : 0

  return (
    <div className="min-h-screen bg-background">
      {/* <DashboardHeader userName={mockUser.name} userEmail={mockUser.email} /> */}

      <main className="p-6 space-y-8">
        <StatsOverview
          totalPoints={totalPoints}
          activeCourses={activeCourses.length}
          completedCourses={completedCourses.length}
          averageProgress={averageProgress}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ActiveCourses courses={activeCourses} />
            <CompletedCourses courses={completedCourses} />
          </div>
          <div>
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  )
}
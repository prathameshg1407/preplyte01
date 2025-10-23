import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, BookOpen, CheckCircle, TrendingUp } from "lucide-react"

interface StatsOverviewProps {
  totalPoints: number
  activeCourses: number
  completedCourses: number
  averageProgress: number
}

export function StatsOverview({ totalPoints, activeCourses, completedCourses, averageProgress }: StatsOverviewProps) {
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

      
    </div>
  )
}

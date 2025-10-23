export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-muted rounded"></div>
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded w-32 ml-auto"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

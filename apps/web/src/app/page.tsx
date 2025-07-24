import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="mb-4">
            Production Ready
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Welcome to AWCRM
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            A modern, production-ready CRM system built with Next.js, TypeScript, and Prisma.
            Manage your customers, deals, and sales pipeline with ease.
          </p>
        </div>

        <div className="flex gap-4">
          <Button size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                Organize and track all your customer information in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete customer profiles with contact history, notes, and activity tracking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deal Pipeline</CardTitle>
              <CardDescription>
                Visual sales pipeline to track deals from lead to close
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Drag-and-drop interface with customizable stages and automated workflows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Comprehensive reporting and business intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Real-time dashboards, custom reports, and predictive analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
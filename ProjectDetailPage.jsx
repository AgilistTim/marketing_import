import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ProjectDetailPage = () => {
  const { projectId } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Details</h1>
        <p className="text-muted-foreground">
          Project ID: {projectId}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Project detail page coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectDetailPage


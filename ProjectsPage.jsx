import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, FolderOpen, Calendar, Users } from 'lucide-react'
import { api } from '../../App'
import LoadingSpinner from '../ui/LoadingSpinner'

const ProjectsPage = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects')
        setProjects(response.projects || [])
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your marketing analytics projects and integrations.
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <Link
                      to={`/projects/${project.id}`}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  </CardTitle>
                  <Badge variant={project.is_active ? 'default' : 'secondary'}>
                    {project.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {project.description && (
                  <CardDescription>{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Platforms</span>
                    <span className="font-medium">{project.platforms.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data Sources</span>
                    <span className="font-medium">{project.active_data_sources_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formatDate(project.created_at)}</span>
                  </div>
                  
                  {project.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {project.platforms.slice(0, 3).map((platform) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform.replace('_', ' ')}
                        </Badge>
                      ))}
                      {project.platforms.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.platforms.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm
              ? 'Try adjusting your search terms.'
              : 'Create your first project to start analyzing your marketing data.'}
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link to="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectsPage


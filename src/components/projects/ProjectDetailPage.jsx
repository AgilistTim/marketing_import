import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Settings, Database, Webhook, Edit, Save } from 'lucide-react'
import { api } from '../../App'
import LoadingSpinner from '../ui/LoadingSpinner'

const ProjectDetailPage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/projects/${projectId}`)
        setProject(response.project)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch project details:', err)
        setError('Failed to load project details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (projectId && projectId !== 'new') {
      fetchProjectDetails()
    } else {
      setLoading(false)
    }
  }, [projectId])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    
    // Validation
    if (!formData.name.trim()) {
      setFormError('Project name is required')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await api.post('/projects', formData)
      
      if (response && response.project) {
        // Navigate to the newly created project
        navigate(`/projects/${response.project.id}`)
      } else {
        setFormError('Failed to create project. Please try again.')
      }
    } catch (err) {
      console.error('Error creating project:', err)
      if (err.details) {
        setFormError(Object.values(err.details).flat().join(', '))
      } else {
        setFormError(err.message || 'Failed to create project. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Details</h1>
          <p className="text-muted-foreground">Project ID: {projectId}</p>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button asChild variant="outline">
                <Link to="/projects">Back to Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (projectId === 'new') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground">
            Set up a new marketing analytics project
          </p>
        </div>
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  {formError}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Project Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="Enter project name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  name="description"
                  placeholder="Enter project description (optional)"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/projects')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Not Found</h1>
          <p className="text-muted-foreground">Project ID: {projectId}</p>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="mb-4">The requested project could not be found.</p>
              <Button asChild variant="outline">
                <Link to="/projects">Back to Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            Created on {formatDate(project.created_at)}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/export?format=csv`} target="_blank">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Link>
          </Button>
        </div>
      </div>

      {project.description && (
        <Card>
          <CardContent className="py-4">
            <p>{project.description}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={project.is_active ? "default" : "secondary"}>
                  {project.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Credentials</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <span className="text-2xl font-bold">{project.active_credentials_count}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/projects/${projectId}/credentials`}>
                    Manage
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <span className="text-2xl font-bold">{project.active_data_sources_count}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/projects/${projectId}/data-sources`}>
                    Manage
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              {project.platforms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.platforms.map(platform => (
                    <Badge key={platform} variant="outline">
                      {platform.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No platforms configured yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data-sources" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Data Sources</CardTitle>
              <Button size="sm" asChild>
                <Link to={`/projects/${projectId}/data-sources`}>
                  <Database className="h-4 w-4 mr-2" />
                  Manage Data Sources
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {project.data_sources && project.data_sources.length > 0 ? (
                <div className="space-y-4">
                  {project.data_sources.map(source => (
                    <div key={source.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{source.source_name}</p>
                        <p className="text-sm text-muted-foreground">{source.platform}</p>
                      </div>
                      <Badge variant={source.is_active ? "default" : "secondary"}>
                        {source.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No data sources configured yet.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to={`/projects/${projectId}/data-sources`}>
                      Add Data Source
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="webhooks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Webhooks</CardTitle>
              <Button size="sm" asChild>
                <Link to={`/projects/${projectId}/webhooks`}>
                  <Webhook className="h-4 w-4 mr-2" />
                  Manage Webhooks
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {project.webhook_configs && project.webhook_configs.length > 0 ? (
                <div className="space-y-4">
                  {project.webhook_configs.map(webhook => (
                    <div key={webhook.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{webhook.name}</p>
                        <p className="text-sm text-muted-foreground">{webhook.target_url}</p>
                      </div>
                      <Badge variant={webhook.is_active ? "default" : "secondary"}>
                        {webhook.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No webhooks configured yet.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to={`/projects/${projectId}/webhooks`}>
                      Add Webhook
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Project ID</h3>
                  <p className="text-sm text-muted-foreground font-mono">{project.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Last Updated</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(project.updated_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Custom Settings</h3>
                  {Object.keys(project.settings).length > 0 ? (
                    <pre className="text-sm bg-muted p-2 rounded">
                      {JSON.stringify(project.settings, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">No custom settings configured.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProjectDetailPage


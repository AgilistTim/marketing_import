import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FolderOpen,
  Key,
  Database,
  Webhook,
  Plus,
  TrendingUp,
  Activity,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { useAuth, api } from '../../App'
import LoadingSpinner from '../ui/LoadingSpinner'

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentProjects, setRecentProjects] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch user stats
        const statsResponse = await api.get(`/users/${user.id}/stats`)
        setStats(statsResponse)

        // Fetch recent projects
        const projectsResponse = await api.get('/projects?per_page=5')
        setRecentProjects(projectsResponse.projects || [])

        // Mock recent activity data (in a real app, this would come from the API)
        setRecentActivity([
          {
            id: 1,
            type: 'extraction',
            message: 'Google Ads data extraction completed',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'success',
          },
          {
            id: 2,
            type: 'credential',
            message: 'Facebook Ads credentials updated',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            status: 'success',
          },
          {
            id: 3,
            type: 'webhook',
            message: 'Excel webhook accessed 15 times',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            status: 'info',
          },
          {
            id: 4,
            type: 'extraction',
            message: 'Shopify data extraction failed',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            status: 'error',
          },
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const getActivityIcon = (type, status) => {
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />
    
    switch (type) {
      case 'extraction':
        return <Database className="h-4 w-4 text-blue-600" />
      case 'credential':
        return <Key className="h-4 w-4 text-purple-600" />
      case 'webhook':
        return <Webhook className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your marketing analytics today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.projects?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.projects?.active || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credentials</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.credentials || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.platforms?.length || 0} platforms connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.data_sources || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.extracted_records || 0} records extracted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.webhooks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active endpoints
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your latest marketing analytics projects
                </CardDescription>
              </div>
              <Button asChild size="sm">
                <Link to="/projects">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{project.platforms.length} platforms</span>
                        <span>•</span>
                        <span>{project.active_data_sources_count} data sources</span>
                      </div>
                    </div>
                    <Badge variant={project.is_active ? 'default' : 'secondary'}>
                      {project.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first project to start analyzing your marketing data.
                </p>
                <Button asChild>
                  <Link to="/projects">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your data sources and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      {stats?.platforms && stats.platforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Platforms</CardTitle>
            <CardDescription>
              Overview of your integrated marketing platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.platforms.map((platform) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {platform.platform.replace('_', ' ')}
                    </span>
                    <Badge variant="outline">{platform.count}</Badge>
                  </div>
                  <Progress value={(platform.count / stats.credentials) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/projects" className="flex flex-col items-center gap-2">
                <FolderOpen className="h-6 w-6" />
                <span>Create New Project</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/projects" className="flex flex-col items-center gap-2">
                <Key className="h-6 w-6" />
                <span>Add Credentials</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/settings" className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Account Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard


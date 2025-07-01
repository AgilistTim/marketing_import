import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Key, Trash, Edit, AlertCircle, Facebook, Search } from 'lucide-react'
import { api } from '../../App'
import LoadingSpinner from '../ui/LoadingSpinner'

const PLATFORMS = {
  facebook_ads: {
    name: 'Facebook Ads',
    icon: <Facebook className="h-4 w-4 mr-2" />,
    description: 'Connect to Facebook Ads for campaign and performance data',
    credentialTypes: [
      {
        type: 'oauth',
        name: 'OAuth',
        fields: [
          { name: 'app_id', label: 'App ID', type: 'text', required: true },
          { name: 'app_secret', label: 'App Secret', type: 'password', required: true },
          { name: 'access_token', label: 'Access Token', type: 'password', required: true },
        ]
      }
    ]
  },
  google_ads: {
    name: 'Google Ads',
    icon: <Search className="h-4 w-4 mr-2" />,
    description: 'Connect to Google Ads for campaign and performance data',
    credentialTypes: [
      {
        type: 'service_account',
        name: 'Service Account',
        fields: [
          { name: 'client_id', label: 'Client ID', type: 'text', required: true },
          { name: 'client_secret', label: 'Client Secret', type: 'password', required: true },
          { name: 'refresh_token', label: 'Refresh Token', type: 'password', required: true },
          { name: 'developer_token', label: 'Developer Token', type: 'password', required: true },
        ]
      }
    ]
  }
}

const CredentialsPage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const returnTo = queryParams.get('returnTo')
  const platformFromQuery = queryParams.get('platform')
  
  const [loading, setLoading] = useState(true)
  const [credentials, setCredentials] = useState([])
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(location.pathname.includes('/new') ? 'add' : 'list')
  const [formData, setFormData] = useState({
    name: '',
    platform: platformFromQuery || '',
    credential_type: '',
    config: {}
  })
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch credentials for this project
        const response = await api.get(`/projects/${projectId}/credentials`)
        setCredentials(response.credentials || [])
      } catch (err) {
        console.error('Failed to fetch credentials:', err)
        setError('Failed to load credentials. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchCredentials()
    }
  }, [projectId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // If platform is changed, reset credential type and config
    if (name === 'platform') {
      setFormData(prev => ({
        ...prev,
        credential_type: '',
        config: {}
      }))
    }
    
    // If credential type is changed, reset config
    if (name === 'credential_type') {
      setFormData(prev => ({
        ...prev,
        config: {}
      }))
    }
  }

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    
    // Validation
    if (!formData.name.trim()) {
      setFormError('Please enter a name for this credential')
      return
    }
    
    if (!formData.platform) {
      setFormError('Please select a platform')
      return
    }
    
    if (!formData.credential_type) {
      setFormError('Please select a credential type')
      return
    }

    // Validate required fields
    const platform = PLATFORMS[formData.platform]
    if (platform) {
      const credType = platform.credentialTypes.find(ct => ct.type === formData.credential_type)
      if (credType) {
        for (const field of credType.fields) {
          if (field.required && !formData.config[field.name]) {
            setFormError(`Please fill in the required field: ${field.label}`)
            return
          }
        }
      }
    }

    try {
      setIsSubmitting(true)
      
      const response = await api.post(`/projects/${projectId}/credentials`, formData)
      
      if (response && response.credential) {
        // Add the new credential to the list
        setCredentials(prev => [...prev, response.credential])
        
        // Reset form
        setFormData({
          name: '',
          platform: '',
          credential_type: '',
          config: {}
        })
        
        // If we have a returnTo parameter, navigate back to that page
        if (returnTo === 'data-sources') {
          // Get the saved form data if available
          const savedFormData = sessionStorage.getItem('dataSourceFormData')
          if (savedFormData) {
            sessionStorage.removeItem('dataSourceFormData')
          }
          navigate(`/projects/${projectId}/data-sources`)
        } else {
          // Otherwise switch to list view
          setActiveTab('list')
        }
      } else {
        setFormError('Failed to create credential. Please try again.')
      }
    } catch (err) {
      console.error('Error creating credential:', err)
      if (err.details) {
        setFormError(Object.values(err.details).flat().join(', '))
      } else {
        setFormError(err.message || 'Failed to create credential. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCredential = async (credentialId) => {
    if (!window.confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return
    }
    
    try {
      await api.delete(`/projects/${projectId}/credentials/${credentialId}`)
      
      // Remove the credential from the list
      setCredentials(prev => prev.filter(cred => cred.id !== credentialId))
    } catch (err) {
      console.error('Failed to delete credential:', err)
      setError('Failed to delete credential. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const selectedPlatform = formData.platform ? PLATFORMS[formData.platform] : null
  const selectedCredentialType = selectedPlatform && formData.credential_type
    ? selectedPlatform.credentialTypes.find(ct => ct.type === formData.credential_type)
    : null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground">
            Manage your API credentials and integrations
          </p>
        </div>
        <Button onClick={() => setActiveTab('add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Credentials</TabsTrigger>
          <TabsTrigger value="add">Add New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4 mt-4">
          {credentials.length > 0 ? (
            <div className="grid gap-4">
              {credentials.map(credential => (
                <Card key={credential.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">{credential.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {PLATFORMS[credential.platform]?.name || credential.platform} - 
                          {credential.credential_type}
                        </p>
                      </div>
                      <Badge>
                        {credential.status || 'Active'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Last used: {credential.last_used_at 
                        ? new Date(credential.last_used_at).toLocaleDateString() 
                        : 'Never'}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Added on {new Date(credential.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteCredential(credential.id)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No credentials yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add your first credential to connect to marketing platforms
                </p>
                <Button onClick={() => setActiveTab('add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credential
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="add" className="space-y-4 mt-4">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add Credential</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {formError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Credential Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name"
                    name="name"
                    placeholder="Enter a name for this credential"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.platform} 
                    onValueChange={(value) => handleSelectChange('platform', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORMS).map(([key, platform]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            {platform.icon}
                            {platform.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedPlatform && (
                  <div className="space-y-2">
                    <Label htmlFor="credential_type">Credential Type <span className="text-red-500">*</span></Label>
                    <Select 
                      value={formData.credential_type} 
                      onValueChange={(value) => handleSelectChange('credential_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select credential type" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPlatform.credentialTypes.map(credType => (
                          <SelectItem key={credType.type} value={credType.type}>
                            {credType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Credential-specific configuration */}
                {selectedCredentialType && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-3">Credential Configuration</h3>
                    <div className="space-y-4">
                      {selectedCredentialType.fields.map(field => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={field.name}>
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder || ''}
                            value={formData.config[field.name] || ''}
                            onChange={(e) => handleConfigChange(field.name, e.target.value)}
                            required={field.required}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (returnTo === 'data-sources') {
                      navigate(`/projects/${projectId}/data-sources`)
                    } else {
                      setActiveTab('list')
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.platform || !formData.credential_type}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Credential
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CredentialsPage


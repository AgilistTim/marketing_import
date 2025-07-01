import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Database, Calendar, RefreshCw, Settings, Facebook, Search, AlertCircle } from 'lucide-react'
import { api } from '../../App'
import LoadingSpinner from '../ui/LoadingSpinner'

const PLATFORMS = {
  facebook_ads: {
    name: 'Facebook Ads',
    icon: <Facebook className="h-4 w-4 mr-2" />,
    description: 'Connect to Facebook Ads for campaign and performance data',
    configFields: [
      { name: 'account_id', label: 'Ad Account ID', type: 'text', required: true, placeholder: 'act_1234567890' },
      { name: 'date_range', label: 'Date Range', type: 'select', required: true, options: [
        { value: 'last_30_days', label: 'Last 30 Days' },
        { value: 'last_90_days', label: 'Last 90 Days' },
        { value: 'last_year', label: 'Last Year' },
        { value: 'lifetime', label: 'Lifetime' },
      ]},
      { name: 'metrics', label: 'Metrics', type: 'multiselect', options: [
        { value: 'impressions', label: 'Impressions' },
        { value: 'clicks', label: 'Clicks' },
        { value: 'spend', label: 'Spend' },
        { value: 'conversions', label: 'Conversions' },
        { value: 'ctr', label: 'CTR' },
        { value: 'cpc', label: 'CPC' },
      ]}
    ]
  },
  google_ads: {
    name: 'Google Ads',
    icon: <Search className="h-4 w-4 mr-2" />,
    description: 'Connect to Google Ads for campaign and performance data',
    configFields: [
      { name: 'customer_id', label: 'Customer ID', type: 'text', required: true, placeholder: '123-456-7890' },
      { name: 'date_range', label: 'Date Range', type: 'select', required: true, options: [
        { value: 'last_30_days', label: 'Last 30 Days' },
        { value: 'last_90_days', label: 'Last 90 Days' },
        { value: 'last_year', label: 'Last Year' },
        { value: 'lifetime', label: 'Lifetime' },
      ]},
      { name: 'metrics', label: 'Metrics', type: 'multiselect', options: [
        { value: 'impressions', label: 'Impressions' },
        { value: 'clicks', label: 'Clicks' },
        { value: 'cost', label: 'Cost' },
        { value: 'conversions', label: 'Conversions' },
        { value: 'ctr', label: 'CTR' },
        { value: 'cpc', label: 'CPC' },
      ]}
    ]
  }
}

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'manual', label: 'Manual Only' }
]

const DataSourcesPage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dataSources, setDataSources] = useState([])
  const [credentials, setCredentials] = useState([])
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('list')
  const [formData, setFormData] = useState({
    credential_id: '',
    platform: '',
    source_name: '',
    extraction_config: {},
    schedule_config: {
      frequency: 'daily',
      time: '00:00',
      day_of_week: 1, // Monday
      day_of_month: 1,
      enabled: true
    }
  })
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch data sources for this project
        const sourcesResponse = await api.get(`/projects/${projectId}/data-sources`)
        setDataSources(sourcesResponse.data_sources || [])
        
        // Fetch available credentials for this project
        const credentialsResponse = await api.get(`/projects/${projectId}/credentials`)
        setCredentials(credentialsResponse.credentials || [])
      } catch (err) {
        console.error('Failed to fetch data sources:', err)
        setError('Failed to load data sources. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchDataSources()
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

    // If platform is changed, update the credential options
    if (name === 'platform') {
      setFormData(prev => ({
        ...prev,
        credential_id: '',
        extraction_config: {}
      }))
    }
  }

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      extraction_config: {
        ...prev.extraction_config,
        [field]: value
      }
    }))
  }

  const handleScheduleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule_config: {
        ...prev.schedule_config,
        [field]: value
      }
    }))
  }

  const handleAddCredential = () => {
    // Save the current form state in session storage to return to it
    sessionStorage.setItem('dataSourceFormData', JSON.stringify(formData));
    // Navigate to credentials page with project ID and return path
    navigate(`/projects/${projectId}/credentials/new?platform=${formData.platform}&returnTo=data-sources`);
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)
    
    // Validation
    if (!formData.credential_id) {
      setFormError('Please select a credential')
      return
    }
    
    if (!formData.source_name.trim()) {
      setFormError('Please enter a name for this data source')
      return
    }

    // Platform-specific validation
    if (formData.platform && PLATFORMS[formData.platform]) {
      const platform = PLATFORMS[formData.platform]
      for (const field of platform.configFields) {
        if (field.required && !formData.extraction_config[field.name]) {
          setFormError(`Please fill in the required field: ${field.label}`)
          return
        }
      }
    }

    try {
      setIsSubmitting(true)
      
      const response = await api.post(`/projects/${projectId}/data-sources`, formData)
      
      if (response && response.data_source) {
        // Add the new data source to the list
        setDataSources(prev => [...prev, response.data_source])
        
        // Reset form and switch to list view
        setFormData({
          credential_id: '',
          platform: '',
          source_name: '',
          extraction_config: {},
          schedule_config: {
            frequency: 'daily',
            time: '00:00',
            day_of_week: 1,
            day_of_month: 1,
            enabled: true
          }
        })
        setActiveTab('list')
      } else {
        setFormError('Failed to create data source. Please try again.')
      }
    } catch (err) {
      console.error('Error creating data source:', err)
      if (err.details) {
        setFormError(Object.values(err.details).flat().join(', '))
      } else {
        setFormError(err.message || 'Failed to create data source. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'running':
        return <Badge>Running</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const filteredCredentials = credentials.filter(cred => 
    !formData.platform || cred.platform === formData.platform
  )

  const selectedPlatform = formData.platform ? PLATFORMS[formData.platform] : null
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground">
            Configure and manage your data extraction sources
          </p>
        </div>
        <Button onClick={() => setActiveTab('add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
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
          <TabsTrigger value="list">Data Sources</TabsTrigger>
          <TabsTrigger value="add">Add New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4 mt-4">
          {dataSources.length > 0 ? (
            <div className="grid gap-4">
              {dataSources.map(source => (
                <Card key={source.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">{source.source_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{PLATFORMS[source.platform]?.name || source.platform}</p>
                      </div>
                      <Badge variant={source.is_active ? "default" : "secondary"}>
                        {source.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Last Extraction</p>
                        <p className="text-sm text-muted-foreground">{formatDate(source.last_extraction_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Next Extraction</p>
                        <p className="text-sm text-muted-foreground">{formatDate(source.next_extraction_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <div className="mt-1">{getStatusBadge(source.extraction_status)}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      {source.data_count} records
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run Now
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No data sources yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add your first data source to start extracting marketing data
                </p>
                <Button onClick={() => setActiveTab('add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Data Source
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="add" className="space-y-4 mt-4">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add Data Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {formError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="source_name">Data Source Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="source_name"
                    name="source_name"
                    placeholder="Enter a name for this data source"
                    value={formData.source_name}
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
                
                {formData.platform && (
                  <div className="space-y-2">
                    <Label htmlFor="credential_id">Credential <span className="text-red-500">*</span></Label>
                    {filteredCredentials.length > 0 ? (
                      <Select 
                        value={formData.credential_id} 
                        onValueChange={(value) => handleSelectChange('credential_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select credential" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCredentials.map(cred => (
                            <SelectItem key={cred.id} value={cred.id}>
                              {cred.platform} - {cred.credential_type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        No credentials available for {PLATFORMS[formData.platform].name}. Please add credentials first.
                      </div>
                    )}
                    
                    {formData.platform && filteredCredentials.length === 0 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAddCredential}
                        className="w-full mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {PLATFORMS[formData.platform].name} Credential
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Platform-specific configuration */}
                {selectedPlatform && formData.credential_id && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium mb-3">Extraction Configuration</h3>
                      <div className="space-y-4">
                        {selectedPlatform.configFields.map(field => (
                          <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name}>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            
                            {field.type === 'text' && (
                              <Input
                                id={field.name}
                                placeholder={field.placeholder || ''}
                                value={formData.extraction_config[field.name] || ''}
                                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                                required={field.required}
                              />
                            )}
                            
                            {field.type === 'select' && (
                              <Select
                                value={formData.extraction_config[field.name] || ''}
                                onValueChange={(value) => handleConfigChange(field.name, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {field.type === 'multiselect' && (
                              <div className="flex flex-wrap gap-2">
                                {field.options.map(option => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`${field.name}_${option.value}`}
                                      checked={(formData.extraction_config[field.name] || []).includes(option.value)}
                                      onChange={(e) => {
                                        const currentValues = formData.extraction_config[field.name] || []
                                        const newValues = e.target.checked
                                          ? [...currentValues, option.value]
                                          : currentValues.filter(v => v !== option.value)
                                        handleConfigChange(field.name, newValues)
                                      }}
                                    />
                                    <label htmlFor={`${field.name}_${option.value}`}>
                                      {option.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium mb-3">Schedule Configuration</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="schedule_enabled">Enable Automatic Extraction</Label>
                          <Switch
                            id="schedule_enabled"
                            checked={formData.schedule_config.enabled}
                            onCheckedChange={(checked) => handleScheduleChange('enabled', checked)}
                          />
                        </div>
                        
                        {formData.schedule_config.enabled && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="schedule_frequency">Frequency</Label>
                              <Select
                                value={formData.schedule_config.frequency}
                                onValueChange={(value) => handleScheduleChange('frequency', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SCHEDULE_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="schedule_time">Time of Day</Label>
                              <Input
                                id="schedule_time"
                                type="time"
                                value={formData.schedule_config.time}
                                onChange={(e) => handleScheduleChange('time', e.target.value)}
                              />
                            </div>
                            
                            {formData.schedule_config.frequency === 'weekly' && (
                              <div className="space-y-2">
                                <Label htmlFor="day_of_week">Day of Week</Label>
                                <Select
                                  value={formData.schedule_config.day_of_week.toString()}
                                  onValueChange={(value) => handleScheduleChange('day_of_week', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Monday</SelectItem>
                                    <SelectItem value="2">Tuesday</SelectItem>
                                    <SelectItem value="3">Wednesday</SelectItem>
                                    <SelectItem value="4">Thursday</SelectItem>
                                    <SelectItem value="5">Friday</SelectItem>
                                    <SelectItem value="6">Saturday</SelectItem>
                                    <SelectItem value="0">Sunday</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {formData.schedule_config.frequency === 'monthly' && (
                              <div className="space-y-2">
                                <Label htmlFor="day_of_month">Day of Month</Label>
                                <Select
                                  value={formData.schedule_config.day_of_month.toString()}
                                  onValueChange={(value) => handleScheduleChange('day_of_month', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[...Array(31)].map((_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {i + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab('list')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.platform || !formData.credential_id}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Data Source
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

export default DataSourcesPage


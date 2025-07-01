import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DataSourcesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
        <p className="text-muted-foreground">
          Configure and manage your data extraction sources.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Data sources management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataSourcesPage


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CredentialsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
        <p className="text-muted-foreground">
          Manage your API credentials and integrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Credentials management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default CredentialsPage


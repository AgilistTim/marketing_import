import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const WebhooksPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground">
          Manage webhook endpoints for Excel and external integrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Webhook management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default WebhooksPage


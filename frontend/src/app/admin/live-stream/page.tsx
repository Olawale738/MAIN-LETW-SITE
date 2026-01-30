import LiveStreamManager from '@/components/admin/LiveStreamManager'

export default function LiveStreamPage() {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Live Stream</h2>
                <p className="text-muted-foreground">
                    Manage live broadcast link and status.
                </p>
            </div>

            <LiveStreamManager />
        </div>
    )
}

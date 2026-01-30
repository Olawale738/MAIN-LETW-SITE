'use client'

import { useState, useEffect } from 'react'
import { liveStreamApi, LiveStream } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Loader2, Video, AlertCircle, CheckCircle2, Radio, Globe } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function LiveStreamManager() {
    const [stream, setStream] = useState<LiveStream | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [url, setUrl] = useState('')
    const [isActive, setIsActive] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        fetchActiveStream()
    }, [])

    const fetchActiveStream = async () => {
        try {
            setLoading(true)
            const activeStream = await liveStreamApi.getActiveStream()
            if (activeStream) {
                setStream(activeStream)
                setUrl(activeStream.url)
                setIsActive(activeStream.is_active)
            } else {
                setStream(null)
                setUrl('')
                setIsActive(false)
            }
        } catch (error) {
            console.error('Failed to fetch stream:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setNotification(null)

        try {
            let response: LiveStream;

            if (!stream || (stream.url !== url && isActive)) {
                response = await liveStreamApi.createStream({
                    url,
                    is_active: isActive
                })
            } else {
                response = await liveStreamApi.updateStream(stream.id, {
                    url,
                    is_active: isActive
                })
            }

            setStream(response)
            setNotification({ type: 'success', message: 'Live stream settings updated successfully' })
        } catch (error) {
            console.error('Failed to save stream:', error)
            setNotification({ type: 'error', message: 'Failed to update live stream settings' })
        } finally {
            setSaving(false)
        }
    }

    const handleEndStream = async () => {
        if (!stream) return;

        setSaving(true)
        try {
            await liveStreamApi.updateStream(stream.id, { is_active: false })
            setIsActive(false)
            setStream(prev => prev ? { ...prev, is_active: false } : null)
            setNotification({ type: 'success', message: 'Stream ended successfully' })
        } catch (e) {
            setNotification({ type: 'error', message: 'Failed to end stream' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#140152]" /></div>
    }

    return (
        <Card className="max-w-3xl mx-auto border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#140152] to-[#0a0129] p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Radio className="h-6 w-6 text-[#f5bb00]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Live Stream Control</h2>
                        <p className="text-white/70 text-sm">Manage your broadcast to the world</p>
                    </div>
                </div>
            </div>

            <CardContent className="p-6 space-y-8">
                {notification && (
                    <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className={notification.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : ''}>
                        {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertTitle>{notification.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>{notification.message}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6">
                    <div className="space-y-3">
                        <Label htmlFor="youtube-url" className="text-base font-semibold">YouTube URL</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400">
                                <Video className="w-5 h-5" />
                            </span>
                            <Input
                                id="youtube-url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="pl-10 h-11 border-gray-200 focus:border-[#140152] focus:ring-[#140152]"
                            />
                        </div>
                        <p className="text-sm text-gray-500 pl-1">
                            Paste the full YouTube URL (e.g., https://youtube.com/watch?v=...)
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    Broadcast Status
                                    {isActive && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                                            LIVE
                                        </span>
                                    )}
                                </Label>
                                <p className="text-sm text-gray-500">
                                    {isActive
                                        ? 'Your stream is currently visible on the home page.'
                                        : 'Stream is offline. Toggle to go live.'}
                                </p>
                            </div>
                            <Switch
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                className="data-[state=checked]:bg-green-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex items-center gap-4 border-t">
                    <Button
                        onClick={handleSave}
                        disabled={saving || !url}
                        className="flex-1 bg-[#140152] hover:bg-[#0a0129] text-white h-11 font-medium"
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isActive ? 'Update Stream Settings' : 'Save Settings'}
                    </Button>

                    {isActive && stream && (
                        <Button
                            variant="destructive"
                            onClick={handleEndStream}
                            disabled={saving}
                            className="h-11"
                        >
                            End Stream
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

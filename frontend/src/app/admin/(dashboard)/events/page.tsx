'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Plus, Trash2, Loader2, Edit2, Calendar, Search, Eye, EyeOff,
    Star, StarOff, MapPin, Clock, Users, X, Upload, Link as LinkIcon
} from 'lucide-react'
import { eventApi, Event, EventCreateData } from '@/lib/api'

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [includePast, setIncludePast] = useState(false)

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Form fields
    const [title, setTitle] = useState('')
    const [eventDate, setEventDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')
    const [eventType, setEventType] = useState('General')
    const [isFeatured, setIsFeatured] = useState(false)
    const [isPublished, setIsPublished] = useState(true)
    const [registrationRequired, setRegistrationRequired] = useState(false)
    const [registrationLink, setRegistrationLink] = useState('')
    const [maxAttendees, setMaxAttendees] = useState<number | ''>('')
    const [imageFile, setImageFile] = useState<File | null>(null)

    const imageInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadEvents()
    }, [includePast])

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null)
                setSuccess(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [error, success])

    const loadEvents = async () => {
        try {
            setLoading(true)
            const data = await eventApi.getAllEvents(includePast)
            setEvents(data.events)
        } catch (err: any) {
            setError(err.message || 'Failed to load events')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setTitle('')
        setEventDate('')
        setStartTime('')
        setEndTime('')
        setDescription('')
        setLocation('')
        setEventType('General')
        setIsFeatured(false)
        setIsPublished(true)
        setRegistrationRequired(false)
        setRegistrationLink('')
        setMaxAttendees('')
        setImageFile(null)
        setEditingEvent(null)
        setShowForm(false)
    }

    const handleEdit = (event: Event) => {
        setEditingEvent(event)
        setTitle(event.title)
        setEventDate(event.event_date)
        setStartTime(event.start_time || '')
        setEndTime(event.end_time || '')
        setDescription(event.description || '')
        setLocation(event.location || '')
        setEventType(event.event_type)
        setIsFeatured(event.is_featured)
        setIsPublished(event.is_published)
        setRegistrationRequired(event.registration_required)
        setRegistrationLink(event.registration_link || '')
        setMaxAttendees(event.max_attendees || '')
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            const data: EventCreateData = {
                title,
                event_date: eventDate,
                description: description || undefined,
                start_time: startTime || undefined,
                end_time: endTime || undefined,
                location: location || undefined,
                event_type: eventType,
                is_featured: isFeatured,
                is_published: isPublished,
                registration_required: registrationRequired,
                registration_link: registrationLink || undefined,
                max_attendees: maxAttendees ? Number(maxAttendees) : undefined,
                image: imageFile || undefined,
            }

            if (editingEvent) {
                await eventApi.updateEvent(editingEvent.id, data)
                setSuccess('Event updated successfully!')
            } else {
                await eventApi.createEvent(data)
                setSuccess('Event created successfully!')
            }

            resetForm()
            await loadEvents()
        } catch (err: any) {
            setError(err.message || 'Failed to save event')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (eventId: string) => {
        if (!confirm('Delete this event? This cannot be undone.')) return
        try {
            await eventApi.deleteEvent(eventId)
            setSuccess('Event deleted')
            await loadEvents()
        } catch (err: any) {
            setError(err.message || 'Failed to delete')
        }
    }

    const toggleFeatured = async (event: Event) => {
        try {
            await eventApi.updateEvent(event.id, { is_featured: !event.is_featured })
            await loadEvents()
        } catch (err: any) {
            setError(err.message || 'Failed to update')
        }
    }

    const togglePublished = async (event: Event) => {
        try {
            await eventApi.updateEvent(event.id, { is_published: !event.is_published })
            setSuccess(event.is_published ? 'Event hidden' : 'Event published')
            await loadEvents()
        } catch (err: any) {
            setError(err.message || 'Failed to update')
        }
    }

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const eventTypes = ['General', 'Worship Night', 'Conference', 'Training', 'Outreach', 'Youth', 'Children', 'Prayer', 'Celebration']

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#140152]">Events</h1>
                    <p className="text-gray-500 text-sm">Manage church events and activities</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="bg-[#f5bb00] text-[#140152] hover:bg-[#d9a600] font-bold"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Event
                </Button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="border-2 border-purple-200 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g., Worship Night"
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                                    <select
                                        value={eventType}
                                        onChange={e => setEventType(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={e => setEventDate(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g., Main Auditorium"
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Event details..."
                                    className="w-full p-2 border rounded-lg"
                                    rows={3}
                                />
                            </div>

                            {/* Registration */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={registrationRequired}
                                        onChange={e => setRegistrationRequired(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">Registration Required</span>
                                </label>
                                {registrationRequired && (
                                    <div className="grid md:grid-cols-2 gap-4 mt-3">
                                        <input
                                            value={registrationLink}
                                            onChange={e => setRegistrationLink(e.target.value)}
                                            placeholder="Registration Link (optional)"
                                            className="w-full p-2 border rounded-lg"
                                        />
                                        <input
                                            type="number"
                                            value={maxAttendees}
                                            onChange={e => setMaxAttendees(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="Max Attendees (optional)"
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Image</label>
                                <div
                                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                                    />
                                    {imageFile ? (
                                        <span className="text-green-600">{imageFile.name}</span>
                                    ) : editingEvent?.has_image ? (
                                        <span className="text-blue-600">Current image set (upload new to replace)</span>
                                    ) : (
                                        <span className="text-gray-400"><Upload className="w-5 h-5 inline mr-2" />Upload Image</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={e => setIsFeatured(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Featured</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={e => setIsPublished(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Published</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={submitting} className="bg-[#140152] hover:bg-[#1d0175]">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingEvent ? 'Update Event' : 'Create Event'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Events List */}
            <Card>
                <CardHeader className="border-b pb-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg flex-1 max-w-md">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm flex-1"
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                                type="checkbox"
                                checked={includePast}
                                onChange={e => setIncludePast(e.target.checked)}
                                className="w-4 h-4"
                            />
                            Include Past Events
                        </label>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchQuery ? 'No events match your search' : 'No events yet. Create your first one!'}
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3">Event</th>
                                    <th className="px-6 py-3">Date & Time</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvents.map((event) => (
                                    <tr key={event.id} className={`bg-white border-b hover:bg-gray-50 transition-colors ${!event.is_published ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#140152]/10 flex items-center justify-center overflow-hidden">
                                                    {event.has_image ? (
                                                        <img src={eventApi.getImageUrl(event.id)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Calendar className="w-4 h-4 text-[#140152]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[#140152]">{event.title}</div>
                                                    {event.location && (
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> {event.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[#140152] font-medium">{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                            {event.start_time && (
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {event.start_time}{event.end_time && ` - ${event.end_time}`}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">{event.event_type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 items-center">
                                                {event.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                                {event.is_published ? (
                                                    <span className="text-green-600 text-xs">Published</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Draft</span>
                                                )}
                                                {event.registration_required && (
                                                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">RSVP</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => toggleFeatured(event)} title="Toggle Featured">
                                                    {event.is_featured ? <StarOff className="w-4 h-4 text-yellow-500" /> : <Star className="w-4 h-4 text-gray-400" />}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => togglePublished(event)} title="Toggle Published">
                                                    {event.is_published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                                                    <Edit2 className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

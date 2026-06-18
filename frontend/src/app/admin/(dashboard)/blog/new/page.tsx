'use client'
// Reuses the dynamic edit page with id="new".
import { useParams } from 'next/navigation'
import EditPage from '../[id]/page'

export default function NewBlogPostPage() {
    return <EditPage />
}

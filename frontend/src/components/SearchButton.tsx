'use client'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import SearchModal from './SearchModal'

/** Floating search button + modal. Drop into navbar or layout.
 *  Cmd/Ctrl-K opens the modal globally. */
export default function SearchButton({ variant = 'icon' }: { variant?: 'icon' | 'pill' }) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setOpen(o => !o)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return (
        <>
            <button onClick={() => setOpen(true)}
                aria-label="Search"
                className={variant === 'icon'
                    ? 'p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
                    : 'inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm px-3 py-2 rounded-lg transition-colors'}>
                <Search className="w-4 h-4" />
                {variant === 'pill' && <><span>Search…</span><kbd className="ml-3 text-[10px] bg-white px-1.5 py-0.5 rounded text-gray-400">⌘K</kbd></>}
            </button>
            <SearchModal open={open} onClose={() => setOpen(false)} />
        </>
    )
}

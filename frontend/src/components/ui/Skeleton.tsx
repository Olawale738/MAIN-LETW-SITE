'use client'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
}

/**
 * Content-shaped loading placeholder. Use instead of spinners.
 * Honours prefers-reduced-motion (animation is disabled there via globals.css).
 */
export function Skeleton({ className, rounded = 'lg', ...rest }: SkeletonProps) {
    return (
        <div
            {...rest}
            className={cn(
                'animate-pulse bg-gray-200/80',
                `rounded-${rounded}`,
                className,
            )}
        />
    )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
            ))}
        </div>
    )
}

export function SkeletonAvatar({ size = 12 }: { size?: number }) {
    return <Skeleton rounded="full" className={`w-${size} h-${size}`} />
}

export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5', className)}>
            <Skeleton className="aspect-video w-full mb-4" rounded="xl" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <SkeletonText lines={2} />
        </div>
    )
}

export function SkeletonListRow({ className }: { className?: string }) {
    return (
        <div className={cn('bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4', className)}>
            <SkeletonAvatar />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/2 mb-1.5" />
                <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-14" />
        </div>
    )
}

/** Grid of N skeleton cards — for blog listings, gallery placeholders. */
export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
    return (
        <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5', className)}>
            {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
    )
}

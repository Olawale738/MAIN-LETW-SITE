'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface SelectContextValue {
    value?: string
    onValueChange?: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue>({
    open: false,
    setOpen: () => { },
})

interface SelectProps {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
    const [open, setOpen] = React.useState(false)

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative">
                {children}
            </div>
        </SelectContext.Provider>
    )
}

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)

    return (
        <button
            ref={ref}
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
        </button>
    )
})
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const { value } = React.useContext(SelectContext)
    return <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
}

const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)

    React.useEffect(() => {
        const handleClickOutside = () => setOpen(false)
        if (open) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [open, setOpen])

    if (!open) return null

    return (
        <div
            ref={ref}
            className={cn(
                "absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg",
                className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
        >
            <div className="p-1">
                {children}
            </div>
        </div>
    )
})
SelectContent.displayName = 'SelectContent'

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
    ({ className, children, value, ...props }, ref) => {
        const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext)
        const isSelected = selectedValue === value

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm text-gray-900 outline-none hover:bg-gray-100 focus:bg-gray-100",
                    isSelected && "bg-gray-100",
                    className
                )}
                onClick={() => {
                    onValueChange?.(value)
                    setOpen(false)
                }}
                {...props}
            >
                <span className="flex-1">{children}</span>
                {isSelected && <Check className="h-4 w-4" />}
            </div>
        )
    }
)
SelectItem.displayName = 'SelectItem'

export {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
}

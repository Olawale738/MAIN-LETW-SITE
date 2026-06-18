'use client'
import { useCallback, useMemo, useState } from 'react'

/**
 * Generic multi-select hook for admin list pages.
 *
 * Usage:
 *   const { selected, isSelected, toggle, selectAll, clear, count } = useMultiSelect(items.map(i => i.id))
 *   <BulkActionBar count={count} actions={[{label:'Delete', onClick: () => deleteMany([...selected])}]} />
 */
export function useMultiSelect<T extends string = string>(allIds: T[] = []) {
    const [selected, setSelected] = useState<Set<T>>(new Set())

    const isSelected = useCallback((id: T) => selected.has(id), [selected])

    const toggle = useCallback((id: T) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }, [])

    const selectAll = useCallback(() => setSelected(new Set(allIds)), [allIds])
    const clear = useCallback(() => setSelected(new Set()), [])
    const count = selected.size
    const allSelected = useMemo(() => allIds.length > 0 && allIds.every(id => selected.has(id)), [allIds, selected])
    const someSelected = count > 0 && !allSelected

    const toggleAll = useCallback(() => {
        allSelected ? clear() : selectAll()
    }, [allSelected, clear, selectAll])

    return { selected, isSelected, toggle, selectAll, clear, toggleAll, count, allSelected, someSelected }
}

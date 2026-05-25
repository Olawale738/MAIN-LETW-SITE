'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, type DeptUser } from '@/lib/dept-api'

export type DeptRole = 'choirmaster' | 'youth_leader' | 'children_coordinator' | 'admin' | 'user'

interface DeptAuthState {
  user: DeptUser | null
  loading: boolean
  error: string | null
}

/**
 * Verifies the current user holds one of the given allowed roles.
 * Redirects to /auth/login if no token exists.
 * Redirects to /unauthorized if the role does not match.
 */
export function useDeptAuth(allowedRoles: DeptRole[]): DeptAuthState {
  const router = useRouter()
  const [state, setState] = useState<DeptAuthState>({ user: null, loading: true, error: null })

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.replace('/auth/login')
      return
    }

    getCurrentUser()
      .then(user => {
        if (!allowedRoles.includes(user.role as DeptRole)) {
          router.replace('/unauthorized')
          return
        }
        setState({ user, loading: false, error: null })
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        router.replace('/auth/login')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}

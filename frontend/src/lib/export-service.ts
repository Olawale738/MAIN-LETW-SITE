/**
 * Data export service
 * Handles downloading reports in CSV and JSON formats
 */

import { ErrorHandler } from './error-handler'

export type ExportFormat = 'csv' | 'json'

export class ExportService {
  /**
   * Export department report
   */
  static async exportDepartmentReport(
    department: string,
    format: ExportFormat = 'csv'
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/export/department/${department}/report?format=${format}`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      this.downloadBlob(blob, `department_report_${department}_${this.getDate()}.${format}`)

      return true
    } catch (error) {
      ErrorHandler.handle(error)
      return false
    }
  }

  /**
   * Export activities
   */
  static async exportActivities(
    options: {
      department?: string
      userId?: string
      format?: ExportFormat
    } = {}
  ): Promise<boolean> {
    try {
      const { department, userId, format = 'csv' } = options

      const params = new URLSearchParams({ format })
      if (department) params.append('department', department)
      if (userId) params.append('user_id', userId)

      const response = await fetch(`/api/export/activities/download?${params}`)

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      this.downloadBlob(blob, `activities_${this.getDate()}.${format}`)

      return true
    } catch (error) {
      ErrorHandler.handle(error)
      return false
    }
  }

  /**
   * Export audit trail
   */
  static async exportAudit(
    department: string,
    format: ExportFormat = 'json'
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/export/audit/${department}/full-export`)

      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        })
        this.downloadBlob(blob, `audit_export_${department}_${this.getDate()}.json`)
      } else {
        // Convert JSON to CSV
        const csv = this.jsonToCsv(data)
        const blob = new Blob([csv], { type: 'text/csv' })
        this.downloadBlob(blob, `audit_export_${department}_${this.getDate()}.csv`)
      }

      return true
    } catch (error) {
      ErrorHandler.handle(error)
      return false
    }
  }

  /**
   * Get analytics summary
   */
  static async getAnalyticsSummary(department: string): Promise<any | null> {
    try {
      const response = await fetch(`/api/export/analytics/${department}/summary`)

      if (!response.ok) throw new Error('Failed to fetch analytics')

      return await response.json()
    } catch (error) {
      ErrorHandler.handle(error)
      return null
    }
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Get current date string for filename
   */
  private static getDate(): string {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  /**
   * Convert JSON to CSV
   */
  private static jsonToCsv(data: any): string {
    if (!data || typeof data !== 'object') {
      return ''
    }

    const lines: string[] = []

    // Get all keys from all objects
    const keys = new Set<string>()
    const collectKeys = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.forEach(collectKeys)
      } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] !== 'object' || obj[key] === null) {
            keys.add(key)
          } else {
            collectKeys(obj[key])
          }
        })
      }
    }

    collectKeys(data)

    const headers = Array.from(keys)
    lines.push(headers.map(h => `"${h}"`).join(','))

    // Flatten and add data rows
    const flattenData = (obj: any, prefix = ''): Record<string, any>[] => {
      if (Array.isArray(obj)) {
        return obj.flatMap(item => flattenData(item, prefix))
      } else if (typeof obj === 'object' && obj !== null) {
        const rows: Record<string, any>[] = [{}]
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const nested = flattenData(value, fullKey)
            rows[0] = { ...rows[0], ...nested[0] }
          } else {
            rows[0][fullKey] = value
          }
        }
        return rows
      }
      return [{}]
    }

    const rows = flattenData(data)
    rows.forEach(row => {
      const values = headers.map(h => {
        const value = row[h]
        if (value === null || value === undefined) return ''
        return `"${String(value).replace(/"/g, '""')}"`
      })
      lines.push(values.join(','))
    })

    return lines.join('\n')
  }
}

/**
 * React hook for export operations
 */
import React from 'react'

export function useExport() {
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const exportDepartmentReport = React.useCallback(
    async (department: string, format: ExportFormat = 'csv') => {
      try {
        setExporting(true)
        setError(null)

        const success = await ExportService.exportDepartmentReport(department, format)

        if (!success) {
          setError('Export failed')
        }

        return success
      } catch (err) {
        const message = ErrorHandler.handle(err)
        setError(message)
        return false
      } finally {
        setExporting(false)
      }
    },
    []
  )

  const exportActivities = React.useCallback(
    async (options?: Parameters<typeof ExportService.exportActivities>[0]) => {
      try {
        setExporting(true)
        setError(null)

        const success = await ExportService.exportActivities(options)

        if (!success) {
          setError('Export failed')
        }

        return success
      } catch (err) {
        const message = ErrorHandler.handle(err)
        setError(message)
        return false
      } finally {
        setExporting(false)
      }
    },
    []
  )

  const exportAudit = React.useCallback(
    async (department: string, format: ExportFormat = 'json') => {
      try {
        setExporting(true)
        setError(null)

        const success = await ExportService.exportAudit(department, format)

        if (!success) {
          setError('Export failed')
        }

        return success
      } catch (err) {
        const message = ErrorHandler.handle(err)
        setError(message)
        return false
      } finally {
        setExporting(false)
      }
    },
    []
  )

  return {
    exporting,
    error,
    exportDepartmentReport,
    exportActivities,
    exportAudit,
    setError,
  }
}

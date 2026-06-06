/**
 * Form validation utilities
 * Provides reusable validation rules and schemas
 */

import React from 'react'

export interface ValidationRule {
  validate: (value: any) => boolean | string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export class Validator {
  /**
   * Validate email format
   */
  static email(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  /**
   * Validate required field
   */
  static required(value: any): boolean {
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return value !== null && value !== undefined
  }

  /**
   * Validate minimum length
   */
  static minLength(min: number) {
    return (value: string): boolean => {
      return value.length >= min
    }
  }

  /**
   * Validate maximum length
   */
  static maxLength(max: number) {
    return (value: string): boolean => {
      return value.length <= max
    }
  }

  /**
   * Validate phone number
   */
  static phone(value: string): boolean {
    // Simple phone validation - accepts various formats
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    return phoneRegex.test(value.replace(/\s/g, ''))
  }

  /**
   * Validate URL
   */
  static url(value: string): boolean {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate number range
   */
  static range(min: number, max: number) {
    return (value: number): boolean => {
      return value >= min && value <= max
    }
  }

  /**
   * Validate pattern match
   */
  static pattern(regex: RegExp) {
    return (value: string): boolean => {
      return regex.test(value)
    }
  }

  /**
   * Custom validation function
   */
  static custom(fn: (value: any) => boolean) {
    return fn
  }

  /**
   * Validate object against schema
   */
  static validateObject(
    data: Record<string, any>,
    schema: Record<string, ValidationRule[]>
  ): ValidationResult {
    const errors: Record<string, string> = {}

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field]

      for (const rule of rules) {
        const result = rule.validate(value)

        // If result is string, it's a custom error message
        if (typeof result === 'string') {
          errors[field] = result
          break
        }

        // If result is false, use the rule's message
        if (result === false) {
          errors[field] = rule.message
          break
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  /**
   * Schema for user login
   */
  login: {
    email: [
      {
        validate: (v: string) => Validator.required(v),
        message: 'Email is required',
      },
      {
        validate: (v: string) => Validator.email(v),
        message: 'Invalid email format',
      },
    ],
    password: [
      {
        validate: (v: string) => Validator.required(v),
        message: 'Password is required',
      },
    ],
  },

  /**
   * Schema for group creation
   */
  groupCreate: {
    name: [
      {
        validate: (v: string) => Validator.required(v),
        message: 'Group name is required',
      },
      {
        validate: (v: string) => Validator.minLength(3)(v),
        message: 'Group name must be at least 3 characters',
      },
      {
        validate: (v: string) => Validator.maxLength(100)(v),
        message: 'Group name cannot exceed 100 characters',
      },
    ],
    leader: [
      {
        validate: (v: string) => Validator.required(v),
        message: 'Leader name is required',
      },
    ],
  },

  /**
   * Schema for message sending
   */
  message: {
    body: [
      {
        validate: (v: string) => Validator.required(v),
        message: 'Message cannot be empty',
      },
      {
        validate: (v: string) => Validator.maxLength(5000)(v),
        message: 'Message cannot exceed 5000 characters',
      },
    ],
  },

  /**
   * Schema for coordinator assignment
   */
  coordinatorAssign: {
    user_id: [
      {
        validate: (v: string) => Validator.required(v),
        message: 'User selection is required',
      },
    ],
  },

  /**
   * Schema for member addition
   */
  memberAdd: {
    email: [
      {
        validate: (v: string) => Validator.required(v),
        message: 'Email is required',
      },
      {
        validate: (v: string) => Validator.email(v),
        message: 'Invalid email format',
      },
    ],
  },
}

/**
 * Hook for form validation (React)
 */
export function useFormValidation<T extends Record<string, any>>(
  schema: Record<string, ValidationRule[]>
) {
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const validate = (data: T): boolean => {
    const result = Validator.validateObject(data, schema)
    setErrors(result.errors)
    return result.isValid
  }

  const clearErrors = () => setErrors({})

  const getError = (field: keyof T): string | undefined => {
    return errors[field as string]
  }

  return {
    validate,
    clearErrors,
    getError,
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}

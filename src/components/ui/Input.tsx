import clsx from 'clsx'
import React from 'react'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className, disabled, ...props }: InputProps) {
  return (
    <input
      {...props}
      disabled={disabled}
      className={clsx(
        'block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    />
  )
}

import clsx from 'clsx'
import React from 'react'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ className, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={clsx(
        'flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    />
  )
}

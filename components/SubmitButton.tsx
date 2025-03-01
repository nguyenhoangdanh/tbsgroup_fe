'use client'
import React from 'react'
import { Button } from './ui/button'
import { Loader } from 'lucide-react'

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  name: string;
}

export default function SubmitButton({
  isLoading = false,
  name,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      disabled={isLoading}
      type="submit"
      className="bg-green-700 text-white hover:bg-green-800 hover:text-white"
      {...props}
    >
      {isLoading && <Loader className="w-4 h-4 animate-spin" />}
      {name}
    </Button>
  )
}

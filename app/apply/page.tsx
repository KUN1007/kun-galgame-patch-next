'use client'

import { Button, Card, Input, Textarea } from '@nextui-org/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Kun() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    experience: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/creator/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit application')
      }

      router.push('/apply/success')
    } catch (error) {
      console.error('Error submitting application:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto my-8">
      <Card className="p-6">
        <h1 className="mb-8 text-2xl font-bold text-center">
          Apply to Become a Creator
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Textarea
              label="Why do you want to become a creator?"
              placeholder="Tell us about your motivation and goals..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              minRows={3}
              required
            />
          </div>
          <div>
            <Textarea
              label="What's your relevant experience?"
              placeholder="Share your background and achievements..."
              value={formData.experience}
              onChange={(e) =>
                setFormData({ ...formData, experience: e.target.value })
              }
              minRows={3}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="w-full sm:w-auto"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function AIComponent() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setResponse("")

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      setResponse(data.response)
    } catch (error) {
      console.error(error)
      setResponse("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., How much did I spend on food this month?"
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Asking..." : "Ask"}
        </Button>
      </form>
      {response && (
        <Card>
          <CardContent className="p-4">
            <p>{response}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Global Error] Critical application error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-4xl font-bold">Critical Error</h1>
            <p className="text-muted-foreground">
              {error.message || "A critical error occurred"}
            </p>
            {error.digest && (
              <p className="text-sm text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

// Made with Bob

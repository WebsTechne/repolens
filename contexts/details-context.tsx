"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface DetailsContextType {
  detailsOpen: boolean
  setDetailsOpen: (open: boolean) => void
  toggleDetails: () => void
}

const DetailsContext = createContext<DetailsContextType | undefined>(undefined)

export function DetailsProvider({ children }: { children: ReactNode }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  const toggleDetails = () => {
    setDetailsOpen((prev) => !prev)
  }

  return (
    <DetailsContext.Provider
      value={{
        detailsOpen,
        setDetailsOpen,
        toggleDetails,
      }}
    >
      {children}
    </DetailsContext.Provider>
  )
}

export function useDetails() {
  const context = useContext(DetailsContext)
  if (context === undefined) {
    throw new Error("useDetails must be used within a DetailsProvider")
  }
  return context
}

// Made with Bob

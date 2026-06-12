import { create } from "zustand"
import { persist } from "zustand/middleware"

interface RepoState {
  username: string
  repoName: string
  branchName: string
  setUsername: (username: string) => void
  setRepoName: (repoName: string) => void
  setBranchName: (branchName: string) => void
  setRepoInfo: (username: string, repoName: string, branchName: string) => void
  clearRepoInfo: () => void
}

export const useRepoStore = create<RepoState>()(
  persist(
    (set) => ({
      username: "",
      repoName: "",
      branchName: "main",
      setUsername: (username) => set({ username }),
      setRepoName: (repoName) => set({ repoName }),
      setBranchName: (branchName) => set({ branchName }),
      setRepoInfo: (username, repoName, branchName) =>
        set({ username, repoName, branchName }),
      clearRepoInfo: () =>
        set({ username: "", repoName: "", branchName: "main" }),
    }),
    {
      name: "repo-storage",
    }
  )
)

// Made with Bob

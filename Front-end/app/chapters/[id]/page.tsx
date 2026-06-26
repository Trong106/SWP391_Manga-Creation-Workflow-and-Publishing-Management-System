"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, BookOpen, AlertTriangle, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VersionCompareDialog } from "@/components/version-compare-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ChapterReaderPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { token, logout } = useAuth()

  const [chapter, setChapter] = useState<any>(null)
  const [pages, setPages] = useState<any[]>([])
  const [allChapters, setAllChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)

  useEffect(() => {
    if (!token || !id) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1. Fetch chapter detail
        const chapterRes = await fetch(`${API_BASE_URL}/api/chapters/${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (chapterRes.status === 401) {
          logout()
          return
        }
        if (!chapterRes.ok) throw new Error("Failed to fetch chapter details.")
        const chapterData = await chapterRes.json()
        setChapter(chapterData)

        // 2. Fetch pages list
        const pagesRes = await fetch(`${API_BASE_URL}/api/chapters/${id}/pages`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        if (!pagesRes.ok) throw new Error("Failed to fetch manga pages.")
        const pagesData = await pagesRes.json()
        // Sort pages ascending by page number
        const sortedPages = [...pagesData].sort((a, b) => a.pageNumber - b.pageNumber)
        setPages(sortedPages)

        // 3. Fetch all chapters in the series to enable navigation
        if (chapterData.seriesId) {
          const allChaptersRes = await fetch(`${API_BASE_URL}/api/series/${chapterData.seriesId}/chapters`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          })
          if (allChaptersRes.ok) {
            const chaptersList = await allChaptersRes.json()
            // Sort ascending by chapterNumber (e.g. Chapter 1, 2, 3...)
            const sortedChapters = [...chaptersList].sort((a, b) => a.chapterNumber - b.chapterNumber)
            setAllChapters(sortedChapters)
          }
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, token])

  const getFullImageUrl = (path?: string | null) => {
    if (!path) return ""
    if (path.startsWith("http")) return path
    return `${API_BASE_URL}${path}`
  }

  // Find current chapter index
  const currentIndex = allChapters.findIndex((c) => c.chapterId === id)
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null
  const nextChapter = currentIndex < allChapters.length - 1 && currentIndex !== -1 ? allChapters[currentIndex + 1] : null

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0B0C0D] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-[#00dfc0] mb-4" />
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Loading chapter contents...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0B0C0D] text-white px-6 text-center">
        <div className="bg-red-500/10 p-4 rounded-full text-red-400 mb-4">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Chapter</h2>
        <p className="text-zinc-400 text-sm max-w-md mb-6">{error}</p>
        <div className="flex gap-4">
          <Button onClick={() => router.back()} variant="outline" className="border-zinc-800 hover:bg-zinc-900 text-white">
            Go Back
          </Button>
          <Button onClick={() => window.location.reload()} className="bg-[#00dfc0] hover:bg-[#00dfc0]/90 text-black font-semibold">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (versionDialogOpen) {
    return (
      <div className="min-h-screen bg-[#0B0C0D] p-4 text-white">
        <VersionCompareDialog
          open={versionDialogOpen}
          onOpenChange={setVersionDialogOpen}
          mode="chapter"
          chapterId={id}
          title={`Chapter ${chapter?.chapterNumber} Versions`}
          token={token}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0C0D] text-white flex flex-col">
      {/* Sticky Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-[#121416]/95 backdrop-blur-md border-b border-[#1A1D1F] py-3 px-4 md:px-6 shadow-md transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Back & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-zinc-400 hover:text-white hover:bg-zinc-850 px-2.5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="hidden md:block h-4 w-px bg-zinc-855" />
            <div className="truncate max-w-[150px] sm:max-w-xs md:max-w-sm">
              <h1 className="text-sm font-bold text-white truncate">{chapter?.seriesTitle || "Manga Series"}</h1>
              <p className="text-xs text-[#00dfc0] font-medium mt-0.5">
                Chapter {chapter?.chapterNumber}{chapter?.title ? `: ${chapter.title}` : ""}
              </p>
            </div>
          </div>

          {/* Quick Select & Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVersionDialogOpen(true)}
              className="bg-[#121416] border-[#1A1D1F] text-zinc-300 hover:text-white hover:bg-zinc-800/80 h-9"
              title="Compare chapter versions"
            >
              <History className="w-4 h-4" />
              <span className="hidden lg:inline ml-2">Versions</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!prevChapter}
              onClick={() => router.push(`/chapters/${prevChapter.chapterId}`)}
              className="bg-[#121416] border-[#1A1D1F] text-zinc-300 hover:text-white hover:bg-zinc-800/80 disabled:opacity-40 h-9"
              title="Previous Chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="w-32 sm:w-48">
              <Select
                value={id}
                onValueChange={(val) => router.push(`/chapters/${val}`)}
              >
                <SelectTrigger className="bg-[#0B0C0D] border-[#1A1D1F] text-white text-xs h-9">
                  <SelectValue placeholder="Select Chapter" />
                </SelectTrigger>
                <SelectContent className="bg-[#121416] border-[#1A1D1F] text-white max-h-[300px]">
                  {allChapters.map((ch) => (
                    <SelectItem
                      key={ch.chapterId}
                      value={ch.chapterId}
                      className="focus:bg-[#00dfc0] focus:text-black text-xs cursor-pointer"
                    >
                      Chapter {ch.chapterNumber}{ch.title ? `: ${ch.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={!nextChapter}
              onClick={() => router.push(`/chapters/${nextChapter.chapterId}`)}
              className="bg-[#121416] border-[#1A1D1F] text-zinc-300 hover:text-white hover:bg-zinc-800/80 disabled:opacity-40 h-9"
              title="Next Chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Manga Pages Container */}
      <main className="flex-1 w-full flex flex-col items-center py-4 bg-[#0B0C0D]">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <BookOpen className="w-16 h-16 text-zinc-700 mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold text-zinc-300">No Pages Available</h2>
            <p className="text-zinc-500 text-sm mt-2 max-w-sm">
              The author hasn't uploaded any pages for this chapter yet. Please check back later!
            </p>
            <Button
              onClick={() => router.back()}
              className="mt-6 bg-[#00dfc0] hover:bg-[#00dfc0]/90 text-black font-semibold"
            >
              Go Back
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-3xl md:max-w-4xl flex flex-col items-center">
            {pages.map((page, index) => (
              <div
                key={page.pageId}
                className="w-full relative flex flex-col items-center group transition-all duration-300"
              >
                <img
                  src={getFullImageUrl(page.currentImageUrl)}
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-auto object-contain select-none max-h-[1600px] border-b border-[#121416]"
                  loading={index > 1 ? "lazy" : "eager"}
                />
                
                {/* Floating Page Number Indicator */}
                <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-sm text-zinc-300 text-[10px] px-2.5 py-1 rounded font-mono select-none pointer-events-none">
                  Page {index + 1} / {pages.length}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom End-of-Chapter Navigation */}
      {pages.length > 0 && (
        <footer className="w-full bg-[#121416] border-t border-[#1A1D1F] py-12 px-4 text-center mt-auto">
          <div className="max-w-md mx-auto space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#00dfc0]/10 flex items-center justify-center mx-auto text-[#00dfc0] mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-white font-semibold">You've finished Chapter {chapter?.chapterNumber}</h3>
              <p className="text-zinc-500 text-xs">
                Thanks for reading! Choose your next action below.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {nextChapter ? (
                <Button
                  onClick={() => router.push(`/chapters/${nextChapter.chapterId}`)}
                  className="w-full bg-[#00dfc0] hover:bg-[#00dfc0]/90 text-black font-bold h-11 flex items-center justify-center gap-2 group transition-all"
                >
                  Read Next Chapter ({nextChapter.chapterNumber})
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              ) : (
                <div className="bg-[#1C1F22] border border-[#2B3034] rounded-lg p-3.5 text-zinc-400 text-sm font-medium">
                  🎉 You are up to date! This is the latest chapter.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  disabled={!prevChapter}
                  onClick={() => router.push(`/chapters/${prevChapter.chapterId}`)}
                  className="bg-[#121416] border-[#1A1D1F] text-zinc-300 hover:text-white hover:bg-zinc-800/80 disabled:opacity-40 h-10"
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Prev Chapter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-[#121416] border-[#1A1D1F] text-zinc-300 hover:text-white hover:bg-zinc-800/80 h-10"
                >
                  Back to Series
                </Button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

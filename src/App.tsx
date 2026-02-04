import { useCallback, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { useFileUpload } from "@/hooks/useFileUpload"
import { useFileParsing } from "@/hooks/useFileParsing"
import { UploadCard } from "@/components/UploadCard"
import { PreviewCard } from "@/components/PreviewCard"

function App() {
  const [step, setStep] = useState<"upload" | "preview">("upload")
  const [paginationLoading, setPaginationLoading] = useState(false)

  // Upload and file handling
  const {
    file,
    isDragging,
    fileInputRef,
    onFileChange,
    clearFile,
  } = useFileUpload()

  // Parsing and data management
  const {
    loading,
    progress: parseProgress,
    data,
    metadata,
    setMetadata,
    loadedCount,
    setLoadedCount,
    parseFile,
    resetParsing,
  } = useFileParsing()

  const handleParse = useCallback(async () => {
    await parseFile(file)
    setStep("preview")
  }, [file, parseFile])

  const handleClearFile = useCallback(() => {
    clearFile()
    resetParsing()
  }, [clearFile, resetParsing])

  const handleBack = useCallback(() => {
    setStep("upload")
  }, [])

  const handleLoadMore = useCallback(
    async (page?: number) => {
      const pageSize = 10
      const required = (page ?? 0) * pageSize
      
      // Check if we already have the data
      if (required <= loadedCount) {
        // Data already available, no need to load or show skeleton
        return
      }

      setPaginationLoading(true)

      setLoadedCount((prev) => {
        const target = Math.max(prev + 50, required)
        return Math.min((data?.length || 0), target)
      })

      setPaginationLoading(false)
    },
    [data?.length, loadedCount, setLoadedCount]
  )

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {isDragging && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="pointer-events-none flex items-center justify-center w-full h-full bg-transparent">
              <div className="pointer-events-auto p-6 rounded-md border border-dashed border-sky-300 bg-white/80 text-sky-700">
                Drop a .csv or .xml file anywhere to upload
              </div>
            </div>
          </div>
        )}

        {step === "upload" && (
          <UploadCard
            file={file}
            loading={loading}
            progress={parseProgress}
            onFileChange={onFileChange}
            onClearFile={handleClearFile}
            onParse={handleParse}
            fileInputRef={fileInputRef}
          />
        )}

        {step === "preview" && (
          <PreviewCard
            data={data}
            metadata={metadata}
            onMetadataChange={setMetadata}
            loadedCount={loadedCount}
            onLoadMore={handleLoadMore}
            paginationLoading={paginationLoading}
            onBack={handleBack}
          />
        )}
      </div>
    </ThemeProvider>
  )
}

export default App

import { useCallback, useRef, useState, useEffect } from "react"

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragCounter = useRef(0)

  const isSupported = useCallback((f: File) => {
    const name = f.name.toLowerCase()
    return name.endsWith(".csv") || name.endsWith(".xml")
  }, [])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    if (!isSupported(f)) {
      alert("Only .csv and .xml files are supported")
      e.currentTarget.value = ""
      return
    }
    setFile(f)
  }, [isSupported])

  const clearFile = useCallback(() => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer?.files?.[0]
    if (!f) return
    if (!isSupported(f)) {
      alert("Only .csv and .xml files are supported")
      return
    }
    setFile(f)
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(f)
      fileInputRef.current.files = dt.files
    }
  }, [isSupported])

  // Global drag handlers so files dropped anywhere on the page are captured
  useEffect(() => {
    function onDragEnter(e: DragEvent) {
      e.preventDefault()
      dragCounter.current += 1
      setIsDragging(true)
    }
    function onDragOver(e: DragEvent) {
      e.preventDefault()
    }
    function onDragLeave(e: DragEvent) {
      e.preventDefault()
      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDragging(false)
      }
    }
    function onDrop(e: DragEvent) {
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)
      const f = e.dataTransfer?.files?.[0]
      if (!f) return
      if (!isSupported(f)) {
        alert("Only .csv and .xml files are supported")
        return
      }
      setFile(f)
      if (fileInputRef.current) {
        const dt = new DataTransfer()
        dt.items.add(f)
        fileInputRef.current.files = dt.files
      }
    }

    window.addEventListener("dragenter", onDragEnter)
    window.addEventListener("dragover", onDragOver)
    window.addEventListener("dragleave", onDragLeave)
    window.addEventListener("drop", onDrop)

    return () => {
      window.removeEventListener("dragenter", onDragEnter)
      window.removeEventListener("dragover", onDragOver)
      window.removeEventListener("dragleave", onDragLeave)
      window.removeEventListener("drop", onDrop)
    }
  }, [isSupported])

  return {
    file,
    setFile,
    isDragging,
    setIsDragging,
    fileInputRef,
    onFileChange,
    clearFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}

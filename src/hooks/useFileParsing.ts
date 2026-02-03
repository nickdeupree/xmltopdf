import { useCallback, useState } from "react"
import Papa from "papaparse"
import XMLParser from "react-xml-parser"

export function useFileParsing() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<Array<Record<string, any>> | null>(null)
  const [metadata, setMetadata] = useState<{ title?: string; subtitle?: string }>({})
  const [loadedCount, setLoadedCount] = useState(10)

  const parseFile = useCallback(async (file: File | null) => {
    if (!file) return
    setLoading(true)
    setProgress(10)
    try {
      const text = await file.text()
      setProgress(40)
      if (file.name.toLowerCase().endsWith(".csv")) {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        })
        // @ts-ignore - papaparse returns any
        const parsed = result.data as Array<Record<string, any>>
        setData(parsed)
        setMetadata({})
        setLoadedCount(Math.min(10, parsed.length))
      } else {
        const xml = new XMLParser().parseFromString(text)
        const metaNode = xml.getElementsByTagName("metadata")[0]
        const title = metaNode?.getElementsByTagName("title")[0]?.value
        const subtitle = metaNode?.getElementsByTagName("subtitle")[0]?.value
        setMetadata({ title, subtitle })

        // Records are top-level children excluding metadata
        const records = xml.children
          .filter((c: any) => c.name !== "metadata")
          .map((r: any) => {
            const obj: Record<string, any> = { ...(r.attributes || {}) }
            r.children.forEach((child: any) => {
              obj[child.name] = child.value
            })
            return obj
          })
        setData(records)
        setLoadedCount(Math.min(10, records.length))
      }

      setProgress(100)
      // small delay so user sees progress and skeleton
      await new Promise((res) => setTimeout(res, 250))
    } catch (err) {
      console.error(err)
      alert("Failed to parse file. Ensure it is well-formed CSV or XML.")
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }, [])

  const resetParsing = useCallback(() => {
    setData(null)
    setMetadata({})
    setLoadedCount(10)
  }, [])

  return {
    loading,
    progress,
    data,
    setData,
    metadata,
    setMetadata,
    loadedCount,
    setLoadedCount,
    parseFile,
    resetParsing,
  }
}

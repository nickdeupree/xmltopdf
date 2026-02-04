import { useCallback, useState } from "react"
import Papa from "papaparse"
import XMLParser from "react-xml-parser"

export function useFileParsing() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Array<Record<string, any>> | null>(null)
  type FileMetadata = {
    title?: string
    subtitle?: string
    artist?: string
    albumTitle?: string
    client?: string
    catalog?: string
    vinylSide?: string
    bits?: string
    sampleRate?: string
    perSideNote?: string
    masteringEngineer?: string
    masteringEngineerName?: string
    masteringEngineerEmail?: string
    customText?: string
    albumDuration?: string
    groupDuration?: string
  }

  const [metadata, setMetadata] = useState<FileMetadata>({})
  const [loadedCount, setLoadedCount] = useState(50)

  const parseFile = useCallback(async (file: File | null) => {
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
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
        setLoadedCount(Math.min(50, parsed.length))
      } else {
        const xml = new XMLParser().parseFromString(text)

        // Parse WaveLab-style CustomText for client/artist/catalog/album and vinyl notes
        const parsedMeta: Record<string, any> = {}
        const customTextNode = xml.getElementsByTagName("CustomText")[0]
        
        // Extract text more reliably - get from original XML text
        let customText = ""
        if (customTextNode) {
          // Find the CustomText content in original XML
          const customTextMatch = text.match(/<CustomText>([\s\S]*?)<\/CustomText>/i)
          customText = customTextMatch ? customTextMatch[1] : (customTextNode.value || "")
        }
        
        if (customText) {
          const lines = customText
            .split(/\r?\n/)
            .map((l: string) => l.trim())

          lines.forEach((line: string) => {
            if (!line) return

            const clientMatch = line.match(/^Client:\s*(.*)$/i)
            if (clientMatch) {
              const val = clientMatch[1].trim()
              if (val) parsedMeta.client = val
            }

            const catMatch = line.match(/^(Cat\. No|Cat No|Catalog #|Catalog):\s*(.*)$/i)
            if (catMatch) {
              const val = catMatch[2].trim()
              if (val) parsedMeta.catalog = val
            }

            const artistMatch = line.match(/^Artist:\s*(.*)$/i)
            if (artistMatch) {
              const val = artistMatch[1].trim()
              if (val) parsedMeta.artist = val
            }

            const titleMatch = line.match(/^Title:\s*(.*)$/i)
            if (titleMatch) {
              const val = titleMatch[1].trim()
              if (val) parsedMeta.albumTitle = val
            }

            const sideMatch = line.match(/^VINYL\s+SIDE\s*([A-Z0-9-]+)?/i)
            if (sideMatch) {
              const val = (sideMatch[1] || "").trim()
              parsedMeta.vinylSide = val || "A"
            }

            const bitsMatch = line.match(/(\d+)\s*bit\s*\/\s*(\d+)\s*khz/i)
            if (bitsMatch) {
              parsedMeta.bits = bitsMatch[1] + "bit"
              parsedMeta.sampleRate = bitsMatch[2] + "khz"
            }

            if (/^Single WAV file per/i.test(line)) {
              parsedMeta.perSideNote = line
            }

            const engineerMatch = line.match(/^(?:mastering(?:\s+engineer)?|mastered by|mastering):\s*(.*)$/i)
            if (engineerMatch) {
              const val = engineerMatch[1].trim()
              if (val) {
                parsedMeta.masteringEngineer = val

                // Try to extract an email address
                const emailMatch = val.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
                if (emailMatch) {
                  parsedMeta.masteringEngineerEmail = emailMatch[1]
                  // Name is the remaining text before the email or before a slash
                  let name = val.replace(emailMatch[0], "").replace(/\s*[\/:\-]\s*$/, "").trim()
                  if (!name) {
                    // fallback to text before a slash
                    const parts = val.split("/").map((p) => p.trim()).filter(Boolean)
                    name = parts[0] || ""
                  }
                  if (name) parsedMeta.masteringEngineerName = name
                } else {
                  // If no email, split on '/' to see if format is 'Name / email' or 'Name / contact'
                  const parts = val.split("/").map((p) => p.trim()).filter(Boolean)
                  if (parts.length === 2 && /@/.test(parts[1])) {
                    parsedMeta.masteringEngineerName = parts[0]
                    parsedMeta.masteringEngineerEmail = parts[1]
                  } else if (parts.length >= 1) {
                    parsedMeta.masteringEngineerName = parts[0]
                  } else {
                    parsedMeta.masteringEngineerName = val
                  }
                }
              }
            }
          })
        }

        // Fallback to generic <metadata> tags if present
        const metaNode = xml.getElementsByTagName("metadata")[0]
        const title = metaNode?.getElementsByTagName("title")[0]?.value
        const subtitle = metaNode?.getElementsByTagName("subtitle")[0]?.value
        if (title && !parsedMeta.albumTitle) parsedMeta.albumTitle = title
        if (subtitle) parsedMeta.subtitle = subtitle

        // Additional direct tags
        const trackGroup = xml.getElementsByTagName("TrackGroup")[0]?.value
        if (trackGroup) parsedMeta.vinylSide = parsedMeta.vinylSide || trackGroup
        const albumDuration = xml.getElementsByTagName("AlbumDuration")[0]?.value
        if (albumDuration) parsedMeta.albumDuration = albumDuration
        const groupDuration = xml.getElementsByTagName("GroupDuration")[0]?.value
        if (groupDuration) parsedMeta.groupDuration = groupDuration

        setMetadata(parsedMeta)

        // Normalize StartM values like "0 s" or "34 s" to "m:ss"
        const normalizeStartM = (val: any) => {
          if (val == null) return val
          const s = String(val).trim()
          const secOnly = s.match(/^(\d+)\s*s$/i)
          if (secOnly) {
            const totalSec = parseInt(secOnly[1], 10)
            const m = Math.floor(totalSec / 60)
            const sec = totalSec % 60
            return `${m}:${sec.toString().padStart(2, "0")}`
          }
          const digitsOnly = s.match(/^(\d+)$/)
          if (digitsOnly) {
            const totalSec = parseInt(digitsOnly[1], 10)
            const m = Math.floor(totalSec / 60)
            const sec = totalSec % 60
            return `${m}:${sec.toString().padStart(2, "0")}`
          }
          // leave mm:ss or other formats as-is
          return s
        }

        // Check if this is WaveLab-style XML with CD-Tracks
        const cdTracksNode = xml.getElementsByTagName("CD-Tracks")[0]
        if (cdTracksNode && cdTracksNode.children && cdTracksNode.children.length > 0) {
          // Extract individual tracks as data rows
          const tracks = cdTracksNode.children.map((t: any) => {
            const track: Record<string, any> = { ...(t.attributes || {}) }
            t.children.forEach((tc: any) => {
              track[tc.name] = tc.name === "StartM" ? normalizeStartM(tc.value) : tc.value
            })
            return track
          })
          setData(tracks)
          setLoadedCount(Math.min(50, tracks.length))
        } else {
          // Fallback: generic XML parsing for other formats
          const records = xml.children
            .filter((c: any) => c.name !== "metadata")
            .map((r: any) => {
              const obj: Record<string, any> = { ...(r.attributes || {}) }
              r.children.forEach((child: any) => {
                obj[child.name] = child.name === "StartM" ? normalizeStartM(child.value) : child.value
              })
              return obj
            })
          setData(records)
          setLoadedCount(Math.min(50, records.length))
        }
      }

      // small delay so user sees progress and skeleton
      await new Promise((res) => setTimeout(res, 250))
    } catch (err) {
      console.error(err)
      alert("Failed to parse file. Ensure it is well-formed CSV or XML.")
    } finally {
      setLoading(false)
    }
  }, [])

  const resetParsing = useCallback(() => {
    setData(null)
    setMetadata({})
    setLoadedCount(10)
  }, [])

  return {
    loading,
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

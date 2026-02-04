import { useCallback, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { ModeToggle } from "@/components/mode-toggle"
import logoUrl from "@/assets/logo.png"
import { createPdfBlob } from "./PdfDocument"

const pageSize = 5

interface PreviewCardProps {
  data: Array<Record<string, any>> | null
  metadata: Record<string, any>
  onMetadataChange: (metadata: Record<string, any>) => void
  loadedCount: number
  onLoadMore: (page: number) => Promise<void>
  paginationLoading: boolean
  onBack: () => void
}

export function PreviewCard({
  data,
  metadata,
  onMetadataChange,
  loadedCount,
  onLoadMore,
  paginationLoading,
  onBack,
}: PreviewCardProps) {
  const [page, setPage] = useState(1)
  const totalPages = data ? Math.max(1, Math.ceil((data.length || 0) / pageSize)) : 1

  const goToPage = useCallback(
    async (p: number) => {
      if (!data) return
      const required = p * pageSize
      if (required > loadedCount) {
        // need to load more
        await onLoadMore(p)
      }
      setPage(p)
    },
    [data, loadedCount, onLoadMore]
  )

  const [converting, setConverting] = useState(false)

  const handleConvert = useCallback(async () => {
    if (!data || data.length === 0) return
    setConverting(true)
    try {
      const blob = await createPdfBlob({ data, metadata, date: new Date(), logo: logoUrl })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const name = `${(metadata?.albumTitle ?? metadata?.title ?? "report").replace(/[^a-z0-9-_]/gi, "_")}-${new Date().toISOString().slice(0,10)}.pdf`
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setConverting(false)
    }
  }, [data, metadata])

  return (
    <Card className="w-full max-w-4xl bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardAction>
          <ModeToggle />
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* progress bar removed: skeleton rows indicate loading */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shadow-md p-4 rounded-lg bg-muted-foreground/5">
          <div className="space-y-2">
            <Label htmlFor="pdf-artist">Artist</Label>
            <Input
              id="pdf-artist"
              placeholder="Artist Name"
              value={metadata.artist ?? ""}
              onChange={(e) => onMetadataChange({ ...metadata, artist: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-album">Album Title</Label>
            <Input
              id="pdf-album"
              placeholder="Album Title"
              value={metadata.albumTitle ?? metadata.title ?? ""}
              onChange={(e) => onMetadataChange({ ...metadata, albumTitle: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-client">Client</Label>
            <Input
              id="pdf-client"
              placeholder="Client Name"
              value={metadata.client ?? ""}
              onChange={(e) => onMetadataChange({ ...metadata, client: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-catalog">Catalog # / Label</Label>
            <Input
              id="pdf-catalog"
              placeholder="Catalog Number"
              value={metadata.catalog ?? ""}
              onChange={(e) => onMetadataChange({ ...metadata, catalog: e.target.value })}
            />
          </div>

          {(metadata.vinylSide || metadata.bits || metadata.sampleRate || metadata.perSideNote) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pdf-side">Vinyl Side</Label>
                <Input
                  id="pdf-side"
                  placeholder="Side (e.g., A, B)"
                  value={metadata.vinylSide ?? ""}
                  onChange={(e) => onMetadataChange({ ...metadata, vinylSide: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf-bits">Bits</Label>
                <Input
                  id="pdf-bits"
                  placeholder="e.g., 24bit"
                  value={metadata.bits ?? ""}
                  onChange={(e) => onMetadataChange({ ...metadata, bits: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf-samplerate">Sample Rate</Label>
                <Input
                  id="pdf-samplerate"
                  placeholder="e.g., 48khz"
                  value={metadata.sampleRate ?? ""}
                  onChange={(e) => onMetadataChange({ ...metadata, sampleRate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf-perside">Per-Side Note</Label>
                <Input
                  id="pdf-perside"
                  placeholder="e.g., Single WAV file per vinyl side"
                  value={metadata.perSideNote ?? ""}
                  onChange={(e) => onMetadataChange({ ...metadata, perSideNote: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="pdf-engineer-name">Mastering Engineer Name</Label>
            <Input
              id="pdf-engineer-name"
              placeholder="Name"
              value={metadata.masteringEngineerName ?? metadata.masteringEngineer ?? ""}
              onChange={(e) => onMetadataChange({ ...metadata, masteringEngineerName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-engineer-email">Mastering Engineer Email</Label>
            <Input
              id="pdf-engineer-email"
              placeholder="Email"
              value={metadata.masteringEngineerEmail ?? ""}
              onChange={(e) => onMetadataChange({ ...metadata, masteringEngineerEmail: e.target.value })}
            />
          </div>
        </div>

        <div>
          {data ? (
            <>
              <Table>
                <TableHeader>
                  <tr>
                    {(Object.keys(data[0] ?? {}) || []).map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </tr>
                </TableHeader>

                <TableBody>
                  {(() => {
                    const cols = (Object.keys(data[0] ?? {}) || [])

                    if (paginationLoading) {
                      // show 5 skeleton rows while loading
                      return Array.from({ length: pageSize }).map((_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                          {cols.map((col) => (
                            <TableCell key={col}>
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    }

                    // compute visible rows from loadedCount and page
                    const start = (page - 1) * pageSize
                    const visible = data.slice(start, start + pageSize)
                    const blanks = Math.max(0, pageSize - visible.length)

                    return (
                      <>
                        {visible.map((row, ri) => (
                          <TableRow key={`row-${ri}`}>
                            {cols.map((col) => (
                              <TableCell key={col}>{row[col] ?? ""}</TableCell>
                            ))}
                          </TableRow>
                        ))}

                        {/* append blank rows so the table always shows `pageSize` rows */}
                        {Array.from({ length: blanks }).map((_, bi) => (
                          <TableRow key={`blank-${bi}`}>
                            {cols.map((col) => (
                              <TableCell key={col}>&nbsp;</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )
                  })()}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => goToPage(Math.max(1, page - 1))}
                        aria-disabled={page === 1}
                      />
                    </PaginationItem>

                    {/* page numbers */}
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => goToPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => goToPage(Math.min(totalPages, page + 1))}
                        aria-disabled={page === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No data to preview.</div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center gap-2">
        <Button onClick={onBack} variant="ghost">Back</Button>
        <Button className="ml-auto" onClick={handleConvert} disabled={!data || data.length === 0 || converting}>
          {converting ? "Converting..." : "Convert to PDF"}
        </Button>
      </CardFooter>
    </Card>
  )
}

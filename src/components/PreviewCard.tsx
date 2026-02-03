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
  metadata: { title?: string; subtitle?: string }
  onMetadataChange: (metadata: { title?: string; subtitle?: string }) => void
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
      const name = `${(metadata?.title ?? "report").replace(/[^a-z0-9-_]/gi, "_")}-${new Date().toISOString().slice(0,10)}.pdf`
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
        <CardDescription>Review parsed data, edit title/subtitle, and convert to PDF.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* progress bar removed: skeleton rows indicate loading */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-title">Title</Label>
            <Input
              id="pdf-title"
              placeholder="Report Title"
              value={metadata.title ?? ""}
              onChange={(e) => onMetadataChange({ ...metadata, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-subtitle">Subtitle</Label>
            <Input
              id="pdf-subtitle"
              placeholder="Report Subtitle"
              value={metadata.subtitle ?? ""}
              onChange={(e) => onMetadataChange({ ...metadata, subtitle: e.target.value })}
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
                  {paginationLoading ? (
                    // show 5 skeleton rows
                    Array.from({ length: pageSize }).map((_, i) => (
                      <TableRow key={i}>
                        {(Object.keys(data[0] ?? {}) || []).map((col) => (
                          <TableCell key={col}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    // compute visible rows from loadedCount and page
                    data.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((row, ri) => (
                      <TableRow key={ri}>
                        {(Object.keys(data[0] ?? {}) || []).map((col) => (
                          <TableCell key={col}>{row[col] ?? ""}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
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

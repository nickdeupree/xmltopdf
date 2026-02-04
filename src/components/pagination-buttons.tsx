import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

type PaginationButtonsProps = {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  maxVisible?: number
  isLoading?: boolean
}

export function PaginationButtons({
  page,
  totalPages,
  onPageChange,
  maxVisible = 7,
  isLoading = false,
}: PaginationButtonsProps) {
  // mirror the pagination algorithm from PreviewCard but keep it self-contained
  if (totalPages <= 0) return null

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem className="pr-2">
          <PaginationPrevious
            onClick={() => !isLoading && onPageChange(Math.max(1, page - 1))}
            aria-disabled={page === 1 || isLoading}
          />
        </PaginationItem>

        {(() => {
          // keep the same rendering behavior as before
          if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => !isLoading && onPageChange(p)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            })
          }

          const baseWindow = maxVisible - 2
          let windowSize = baseWindow

          let start = page - Math.floor((windowSize - 1) / 2)
          let end = start + windowSize - 1

          if (start < 2) {
            start = 2
            end = start + windowSize - 1
          }
          if (end > totalPages - 1) {
            end = totalPages - 1
            start = end - windowSize + 1
            if (start < 2) start = 2
          }

          if (start > 2 && end < totalPages - 1) {
            windowSize = 4
            start = page - Math.floor((windowSize - 1) / 2)
            end = start + windowSize - 1

            if (start < 2) {
              start = 2
              end = start + windowSize - 1
            }
            if (end > totalPages - 1) {
              end = totalPages - 1
              start = end - windowSize + 1
              if (start < 2) start = 2
            }
          }

          return (
            <>
              <PaginationItem key={1}>
                <PaginationLink isActive={1 === page} onClick={() => !isLoading && onPageChange(1)}>
                  1
                </PaginationLink>
              </PaginationItem>

              {start > 2 && (
                <PaginationItem key="left-ellipsis">
                  <PaginationEllipsis
                    onClick={() => !isLoading && onPageChange(Math.max(1, page - 4))}
                    aria-label="Jump back 4 pages"
                  />
                </PaginationItem>
              )}

              {Array.from({ length: end - start + 1 }).map((_, idx) => {
                const p = start + idx
                return (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} onClick={() => !isLoading && onPageChange(p)}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {end < totalPages - 1 && (
                <PaginationItem key="right-ellipsis">
                  <PaginationEllipsis
                    onClick={() => !isLoading && onPageChange(Math.min(totalPages, page + 4))}
                    aria-label="Jump forward 4 pages"
                  />
                </PaginationItem>
              )}

              <PaginationItem key={totalPages}>
                <PaginationLink isActive={totalPages === page} onClick={() => !isLoading && onPageChange(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )
        })()}

        <PaginationItem className="pl-2">
          <PaginationNext
            onClick={() => !isLoading && onPageChange(Math.min(totalPages, page + 1))}
            aria-disabled={page === totalPages || isLoading}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

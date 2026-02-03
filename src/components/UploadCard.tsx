import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Undo2, FileUp } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

interface UploadCardProps {
  file: File | null
  loading: boolean
  progress: number
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearFile: () => void
  onParse: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export function UploadCard({
  file,
  loading,
  progress,
  onFileChange,
  onClearFile,
  onParse,
  fileInputRef,
}: UploadCardProps) {
  return (
    <Card className="w-full max-w-md bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>XML/CSV to PDF</CardTitle>
        <CardAction>
          <ModeToggle />
        </CardAction>
        <CardDescription>Upload a file to generate a PDF report.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading && <Progress value={progress} />}

        <div className="space-y-2">
          <Label>File Upload</Label>
          <div className={`flex w-full items-center gap-2 p-2 rounded`}>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xml"
              className="cursor-pointer bg-transparent"
              onChange={onFileChange}
            />

            <Button
              variant="outline"
              size="icon"
              title="Undo / Remove File"
              onClick={onClearFile}
              disabled={!file}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </div>

          {file ? (
            <div className="text-sm text-muted-foreground mt-1">
              Selected: <span className="font-medium">{file.name}</span> • {formatBytes(file.size)}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">Drag a .csv or .xml file here, or click to select.</div>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={!file || loading}
          title={!file ? "Select a file to enable" : "Parse file and preview"}
          onClick={onParse}
        >
          <FileUp className="mr-2 h-4 w-4" /> Next
        </Button>
      </CardFooter>
    </Card>
  )
}

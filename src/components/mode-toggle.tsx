import { useState } from "react"
import { Sun, Moon, Computer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

const modes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"]

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  function cycle() {
    const i = modes.indexOf(theme as any)
    const next = modes[(i + 1) % modes.length]
    setTheme(next)
  }

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="icon"
        title={`Theme: ${theme}`}
        onClick={cycle}
        aria-label="Toggle theme"
      >
        <Sun className={`h-[1.2rem] w-[1.2rem] transition-transform ${theme === "light" ? "scale-100 rotate-0" : "scale-0 -rotate-90"}`} />
        <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-transform ${theme === "dark" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
        <Computer className={`absolute h-[1.2rem] w-[1.2rem] transition-transform ${theme === "system" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`} />
      </Button>
    </div>
  )
}

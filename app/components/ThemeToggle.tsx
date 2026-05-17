import { Moon, Sun } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { Theme } from "~/models/ApplicationConfiguration"

export const ThemeToggle = () => {
  const { theme, setTheme } = useApplicationConfiguration()
  const isDark = theme === Theme.Dark

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? Theme.Light : Theme.Dark)}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}

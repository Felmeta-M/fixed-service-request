import * as React from "react"

const MOBILE_BREAKPOINT = 768

/** Tailwind sm breakpoint – use for services carousel and other sm: alignment */
export const SMALL_SCREEN_BREAKPOINT = 640

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsSmallScreen() {
  const [isSmall, setIsSmall] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${SMALL_SCREEN_BREAKPOINT}px)`)
    const onChange = () => setIsSmall(window.innerWidth <= SMALL_SCREEN_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsSmall(window.innerWidth <= SMALL_SCREEN_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isSmall
}

import { useState, useEffect } from "react"
import { Queuelly, QueuellyManager } from "@queuelly/core"

interface WaitForQueuellyOpts {
  onEndProcess(): void
}

export function useWaitForQueuelly<T>(queuelly: Queuelly<T> | QueuellyManager<T>, opts?: WaitForQueuellyOpts) {
  const [isPending, setIsPending] = useState(queuelly?.isPending ?? false)

  useEffect(() => {
    if (!queuelly) {
      return
    }

    const handleStartProcess = () => {
      setIsPending(true)
    }

    const handleEndProcess = () => {
      opts?.onEndProcess?.()

      setIsPending(false)
    }

    queuelly.addEventListener("startProcess", handleStartProcess)
    queuelly.addEventListener("endProcess", handleEndProcess)

    return () => {
      queuelly.removeEventListener("startProcess", handleStartProcess)
      queuelly.removeEventListener("endProcess", handleEndProcess)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.onEndProcess])

  return isPending
}

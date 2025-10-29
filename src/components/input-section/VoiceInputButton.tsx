import { useCallback, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import Button from "../ui/Button"

type VoiceInputButtonProps = {
  setText: Dispatch<SetStateAction<string>>
  onError?: (message: string) => void
}

export default function VoiceInputButton({ setText, onError }: VoiceInputButtonProps) {
  const [isRequestingMic, setIsRequestingMic] = useState(false)

  const onClick = useCallback(async () => {
    setIsRequestingMic(true)
    
    try {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const activeTab = tabs[0]
      
      if (!activeTab?.id) {
        onError?.('No active tab found')
        setIsRequestingMic(false)
        return
      }

      // Send message to content script to start voice input
      chrome.tabs.sendMessage(activeTab.id, { action: 'START_VOICE_INPUT' }, (response) => {
        setIsRequestingMic(false)
        
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError)
          onError?.('Failed to communicate with page. Please refresh and try again.')
          return
        }

        if (response?.success && response?.transcript) {
          // Append transcript to existing text
          setText(prev => {
            if (!prev) return response.transcript
            return prev.endsWith(' ') ? `${prev}${response.transcript}` : `${prev} ${response.transcript}`
          })
        } else if (response?.error) {
          onError?.(response.error)
        } else {
          onError?.('Voice capture failed')
        }
      })
      
    } catch (error) {
      console.error('Error starting voice input:', error)
      onError?.('Failed to start voice input')
      setIsRequestingMic(false)
    }
  }, [onError, setText])

  return (
    <Button
      color='ghost'
      shape='circle'
      size='small'
      onClick={onClick}
      aria-label={isRequestingMic ? 'Starting voice input...' : 'Start voice input'}
      disabled={isRequestingMic}
    >
      {isRequestingMic ? (
        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" className="text-black/20" stroke="currentColor" strokeOpacity="0.2" />
          <path d="M21 12a9 9 0 0 0-9-9" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-audio-lines-icon lucide-audio-lines"><path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" /></svg>
      )}
    </Button>
  )
}

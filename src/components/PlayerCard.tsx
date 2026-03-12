import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Upload, Play, Pause, X, Music, Mic, MicOff, Sparkles } from 'lucide-react'
import { blink } from '@/lib/blink'
import toast from 'react-hot-toast'

interface PlayerCardProps {
  id: string
  initialName?: string
  initialNumber?: string
  initialAudioUrl?: string
}

export function PlayerCard({ id, initialName = '', initialNumber = '', initialAudioUrl = '' }: PlayerCardProps) {
  const [name, setName] = useState(initialName)
  const [number, setNumber] = useState(initialNumber)
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditingName, setIsEditingName] = useState(!initialName)
  const [isEditingNumber, setIsEditingNumber] = useState(!initialNumber)
  
  // AI Mode state
  const [aiMode, setAiMode] = useState(true) // true = Whisper API, false = User Recording
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file must be less than 10MB')
      return
    }

    setIsUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'mp3'
      const safeId = id.replace(/[^a-zA-Z0-9]/g, '-')
      const path = `walkup-${safeId}-${Date.now()}.${ext}`
      const { publicUrl } = await blink.storage.upload(file, path)
      setAudioUrl(publicUrl)
      toast.success('Walkup music uploaded!')
    } catch (error: unknown) {
      console.error('Upload failed:', error)
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Upload failed: ${msg}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePlay = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleRemoveAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setAudioUrl('')
  }

  // Start/stop recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        chunksRef.current = []
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data)
          }
        }
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          
          if (aiMode) {
            // AI Mode: Transcribe with Whisper and extract name/number
            await processTranscription(audioBlob)
          } else {
            // User Recording Mode: Save as walkup music
            await saveRecordedAudio(audioBlob)
          }
        }
        
        recorder.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Failed to start recording:', error)
        toast.error('Failed to access microphone')
      }
    }
  }

  // Process transcription with Whisper API
  const processTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      // Convert blob to base64
      const base64 = await blobToBase64(audioBlob)
      
      // Transcribe with Whisper
      const { text } = await blink.ai.transcribeAudio({
        audio: base64,
        language: 'en'
      })
      
      toast.success(`Transcribed: "${text}"`)
      
      // Parse name and number from transcription
      const parsed = parseAnnouncement(text)
      
      if (parsed) {
        if (parsed.number) {
          setNumber(parsed.number)
          setIsEditingNumber(false)
        }
        if (parsed.name) {
          setName(parsed.name)
          setIsEditingName(false)
        }
        toast.success(`Extracted: #${parsed.number} ${parsed.name}`)
      } else {
        toast.error('Could not extract name/number. Try speaking clearly.')
      }
    } catch (error: unknown) {
      console.error('Transcription failed:', error)
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Transcription failed: ${msg}`)
    } finally {
      setIsTranscribing(false)
      chunksRef.current = []
    }
  }

  // Parse "Now Batting Number X Name" or "Number X Name" from text
  const parseAnnouncement = (text: string): { number?: string; name?: string } => {
    const result: { number?: string; name?: string } = {}
    const lowerText = text.toLowerCase()
    
    // Look for number pattern (digit or word number)
    const numberMatch = lowerText.match(/(?:number\s*|#|no\.?)\s*(\d+)|(\d+)/i)
    if (numberMatch) {
      result.number = numberMatch[1] || numberMatch[2]
    }
    
    // Remove known phrases to get the name
    let nameText = lowerText
      .replace(/now\s*batting/i, '')
      .replace(/number\s*\d+/i, '')
      .replace(/#\d+/i, '')
      .replace(/no\.?\s*\d+/i, '')
      .replace(/[0-9]/g, '')
      .trim()
    
    // Clean up common words
    nameText = nameText
      .replace(/^(is\s+)?(the\s+)?(player\s+)?/i, '')
      .replace(/\s+(is\s+)?(the\s+)?(player\s+)?$/i, '')
      .trim()
    
    if (nameText.length > 0 && nameText.length < 30) {
      // Capitalize first letter of each word
      result.name = nameText.replace(/\b\w/g, c => c.toUpperCase())
    }
    
    return result
  }

  // Save recorded audio as walkup music
  const saveRecordedAudio = async (audioBlob: Blob) => {
    setIsUploading(true)
    try {
      const safeId = id.replace(/[^a-zA-Z0-9]/g, '-')
      const path = `walkup-${safeId}-${Date.now()}.webm`
      
      // Convert blob to file
      const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
      
      const { publicUrl } = await blink.storage.upload(file, path)
      setAudioUrl(publicUrl)
      toast.success('Walkup music recorded!')
    } catch (error: unknown) {
      console.error('Save failed:', error)
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to save: ${msg}`)
    } finally {
      setIsUploading(false)
      chunksRef.current = []
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        resolve(dataUrl.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  return (
    <Card className="group relative overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-gradient-to-br from-card to-muted/30">
      <CardContent className="p-0">
        {/* AI/Recording Toggle - Top of Card */}
        <div className="p-3 bg-muted/30 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            {aiMode ? (
              <Sparkles className="w-4 h-4 text-primary" />
            ) : (
              <Mic className="w-4 h-4 text-primary" />
            )}
            <Label htmlFor={`ai-mode-${id}`} className="text-xs font-medium cursor-pointer">
              {aiMode ? 'AI Mode' : 'Record Mode'}
            </Label>
            <Switch
              id={`ai-mode-${id}`}
              checked={aiMode}
              onCheckedChange={setAiMode}
            />
          </div>
          <Button
            size="sm"
            variant={isRecording ? "destructive" : "outline"}
            onClick={toggleRecording}
            disabled={isUploading || isTranscribing}
            className="h-8 px-3 rounded-full"
          >
            {isRecording ? (
              <>
                <MicOff className="w-3 h-3 mr-1" />
                Stop
              </>
            ) : isTranscribing ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="w-3 h-3 mr-1" />
                {aiMode ? 'Speak Name & #' : 'Record Voice'}
              </>
            )}
          </Button>
        </div>

        {/* Card Header - Navy Background */}
        <div className="bg-gradient-to-r from-secondary to-secondary/90 p-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-accent">
              <Music className="w-8 h-8 text-accent" />
            </div>
          </div>
          
          {/* Player Number */}
          <div className="mb-2">
            {isEditingNumber ? (
              <Input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onBlur={() => setIsEditingNumber(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingNumber(false)}
                placeholder="00"
                className="w-20 mx-auto text-center text-3xl font-bold bg-white/20 border-0 text-white placeholder:text-white/50 focus:ring-2 focus:ring-accent"
                maxLength={2}
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingNumber(true)}
                className="text-5xl font-black text-white tracking-wider hover:text-accent transition-colors cursor-pointer"
              >
                {number || '00'}
              </button>
            )}
          </div>

          {/* Player Name */}
          <div>
            {isEditingName ? (
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                placeholder="Player Name"
                className="text-xl font-semibold bg-white/20 border-0 text-white placeholder:text-white/50 focus:ring-2 focus:ring-accent text-center"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xl font-semibold text-white hover:text-accent transition-colors cursor-pointer"
              >
                {name || 'Tap to add name'}
              </button>
            )}
          </div>
        </div>

        {/* Audio Controls */}
        <div className="p-4 space-y-3">
          {audioUrl ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePlay}
                  className={`flex-1 h-12 rounded-full transition-all duration-200 ${
                    isPlaying
                      ? 'bg-primary text-white animate-pulse'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play Walkup
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRemoveAudio}
                  className="h-12 w-12 rounded-full border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center truncate">
                Audio uploaded
              </p>
            </>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="w-full h-12 rounded-full border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Walkup Music
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                MP3, WAV, or M4A (max 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Hidden Audio Element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
          />
        )}
      </CardContent>
    </Card>
  )
}

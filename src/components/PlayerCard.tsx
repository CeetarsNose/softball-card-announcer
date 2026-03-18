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
  const [audioFileName, setAudioFileName] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditingName, setIsEditingName] = useState(!initialName)
  const [isEditingNumber, setIsEditingNumber] = useState(!initialNumber)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Announcement mode: true = AI TTS, false = User Recording
  const [aiMode, setAiMode] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Cache: "number-name" -> generated audio URL
  const announcementCache = useRef<Map<string, string>>(new Map())

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const announcementAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isAnnouncementPlaying, setIsAnnouncementPlaying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Track auth state
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setIsAuthenticated(state.isAuthenticated)
    })
    return unsubscribe
  }, [])

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
      setAudioFileName(file.name)
      toast.success('Walkup music uploaded!')
    } catch (error: unknown) {
      console.error('Upload failed:', error)
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Upload failed: ${msg}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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

  const handleAudioEnded = () => setIsPlaying(false)

  const handleRemoveAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setAudioUrl('')
    setAudioFileName('')
  }

  // Generate AI announcement using Text-to-Speech
  const generateAnnouncement = async () => {
    if (!name || !number) {
      toast.error('Please add both player number and name first')
      return
    }

    // Require auth — redirect to login if not signed in
    if (!isAuthenticated) {
      toast('Sign in to use AI announcements', { icon: '🔒' })
      blink.auth.login(window.location.href)
      return
    }

    const cacheKey = `${number}-${name}`

    // Return cached audio immediately if available
    if (announcementCache.current.has(cacheKey)) {
      playAnnouncementUrl(announcementCache.current.get(cacheKey)!)
      toast.success('Playing cached announcement!')
      return
    }

    setIsGenerating(true)
    try {
      const { audio } = await blink.functions.invoke('softball-voice', {
        body: { number, name }
      })

      if (!audio) throw new Error('No audio returned from server')

      // Convert base64 to blob URL
      const byteCharacters = atob(audio)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      // Cache the URL and play it
      announcementCache.current.set(cacheKey, url)
      playAnnouncementUrl(url)
      toast.success('Announcement ready!')
    } catch (error: unknown) {
      console.error('Generation failed:', error)
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to generate: ${msg}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const playAnnouncementUrl = (url: string) => {
    if (announcementAudioRef.current) {
      announcementAudioRef.current.pause()
      announcementAudioRef.current = null
    }
    const audio = new Audio(url)
    announcementAudioRef.current = audio
    audio.onplay = () => setIsAnnouncementPlaying(true)
    audio.onended = () => setIsAnnouncementPlaying(false)
    audio.onerror = () => setIsAnnouncementPlaying(false)
    audio.play()
  }

  // Start/stop recording for Record mode
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        chunksRef.current = []

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          await saveRecordedAudio(audioBlob)
        }

        recorder.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Failed to start recording:', error)
        toast.error('Failed to access microphone')
      }
    }
  }

  const saveRecordedAudio = async (audioBlob: Blob) => {
    setIsUploading(true)
    try {
      const safeId = id.replace(/[^a-zA-Z0-9]/g, '-')
      const path = `walkup-${safeId}-${Date.now()}.webm`
      const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
      const { publicUrl } = await blink.storage.upload(file, path)
      setAudioUrl(publicUrl)
      setAudioFileName('recording.webm')
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

  const cacheKey = `${number}-${name}`
  const isCached = announcementCache.current.has(cacheKey)

  return (
    <Card className="group relative overflow-hidden border border-primary/10 hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(100,255,0,0.1)] bg-card">
      <CardContent className="p-0">
        {/* Announcement Toggle Bar */}
        <div className="p-1.5 bg-black/40 border-b border-primary/10 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            {aiMode ? (
              <Sparkles className="w-3 h-3 text-primary" />
            ) : (
              <Mic className="w-3 h-3 text-primary" />
            )}
            <Label htmlFor={`ai-mode-${id}`} className="text-[8px] uppercase font-black tracking-widest text-muted-foreground cursor-pointer select-none">
              {aiMode ? 'AI' : 'REC'}
            </Label>
            <Switch
              id={`ai-mode-${id}`}
              checked={aiMode}
              onCheckedChange={setAiMode}
              className="scale-75 data-[state=checked]:bg-primary"
            />
          </div>

          {aiMode ? (
            <Button
              size="sm"
              variant={isAnnouncementPlaying ? 'default' : isCached ? 'secondary' : 'outline'}
              onClick={generateAnnouncement}
              disabled={isGenerating}
              className={`h-6 px-2 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all ${
                isAnnouncementPlaying ? 'bg-primary text-black animate-pulse shadow-[0_0_15px_rgba(100,255,0,0.5)]' : ''
              }`}
            >
              {isGenerating ? (
                '...'
              ) : isAnnouncementPlaying ? (
                'PLAYING'
              ) : isCached ? (
                'READY'
              ) : (
                'GENERATE'
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={toggleRecording}
              disabled={isUploading}
              className="h-6 px-2 rounded-full text-[8px] font-black uppercase tracking-tighter"
            >
              {isRecording ? (
                'STOP'
              ) : isUploading ? (
                '...'
              ) : (
                'REC'
              )}
            </Button>
          )}
        </div>

        {/* Card Header - Black/Panthers Aesthetic */}
        <div className="bg-black p-3 text-center relative overflow-hidden">
          {/* Faded Panther Background or Design Element */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8" />
          
          <div className="flex justify-center mb-1 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/50">
              <Music className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Player Number */}
          <div className="mb-0.5 relative z-10">
            {isEditingNumber ? (
              <Input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onBlur={() => setIsEditingNumber(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingNumber(false)}
                placeholder="00"
                className="w-16 mx-auto text-center text-xl font-black bg-white/5 border-primary/30 text-primary h-8"
                maxLength={2}
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingNumber(true)}
                className="text-4xl font-black text-white italic tracking-tighter hover:text-primary transition-all cursor-pointer"
              >
                {number || '00'}
              </button>
            )}
          </div>

          {/* Player Name */}
          <div className="relative z-10">
            {isEditingName ? (
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                placeholder="Name"
                className="text-xs font-bold bg-white/5 border-primary/30 text-white text-center h-8"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-sm font-black text-primary uppercase tracking-tight hover:scale-105 transition-transform cursor-pointer block w-full truncate italic"
              >
                {name || 'ADD NAME'}
              </button>
            )}
          </div>
        </div>

        {/* Walkup Music Controls */}
        <div className="p-3 space-y-2 bg-zinc-900/50">
          {audioUrl ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePlay}
                  size="sm"
                  className={`flex-1 h-10 rounded-lg font-black uppercase italic tracking-wider text-[10px] ${
                    isPlaying
                      ? 'bg-primary text-black shadow-[0_0_20px_rgba(100,255,0,0.4)] scale-[1.02]'
                      : 'bg-zinc-800 hover:bg-primary hover:text-black text-primary border border-primary/20'
                  }`}
                >
                  {isPlaying ? (
                    <>PAUSE</>
                  ) : (
                    <>WALKUP</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRemoveAudio}
                  className="h-10 w-10 rounded-lg border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-full px-1">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="truncate">{audioFileName || 'Audio Loaded'}</span>
              </div>
            </>
          ) : (
            <div className="space-y-2">
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
                className="w-full h-10 rounded-lg border-dashed border border-primary/20 hover:border-primary/60 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary font-bold uppercase text-[8px] tracking-widest"
              >
                {isUploading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
                    UPLOADING...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1" />
                    UPLOAD
                  </>
                )}
              </Button>
              <p className="text-[8px] font-medium text-center text-muted-foreground/60 uppercase">
                MP3 / WAV / M4A (10MB)
              </p>
            </div>
          )}
        </div>

        {/* Hidden Audio Element for walkup music */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} />
        )}
      </CardContent>
    </Card>
  )
}

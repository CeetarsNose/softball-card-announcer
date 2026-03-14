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
      const announcementText = `Now Batting, Number ${number}, ${name}`

      const { url } = await blink.ai.generateSpeech({
        text: announcementText,
        voice: 'onyx',
      })

      // Cache the URL and play it
      announcementCache.current.set(cacheKey, url)
      playAnnouncementUrl(url)
      toast.success('Announcement ready!')
    } catch (error: unknown) {
      console.error('Generation failed:', error)
      // If auth error slipped through, trigger login
      const isAuthErr =
        (error as { code?: string })?.code === 'HTTP 401' ||
        (error as { message?: string })?.message?.includes('401') ||
        (error as { details?: { originalError?: { code?: string } } })?.details?.originalError?.code === 'HTTP 401'
      if (isAuthErr) {
        toast('Sign in required for AI announcements', { icon: '🔒' })
        blink.auth.login(window.location.href)
      } else {
        const msg = error instanceof Error ? error.message : String(error)
        toast.error(`Failed to generate: ${msg}`)
      }
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
    <Card className="group relative overflow-hidden border-2 border-primary/10 hover:border-primary transition-all duration-500 hover:shadow-[0_0_30px_rgba(100,255,0,0.15)] bg-card">
      <CardContent className="p-0">
        {/* Announcement Toggle Bar */}
        <div className="p-3 bg-black/40 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {aiMode ? (
              <Sparkles className="w-4 h-4 text-primary" />
            ) : (
              <Mic className="w-4 h-4 text-primary" />
            )}
            <Label htmlFor={`ai-mode-${id}`} className="text-[10px] uppercase font-black tracking-widest text-muted-foreground cursor-pointer select-none">
              {aiMode ? 'AI ANNOUNCE' : 'RECORD'}
            </Label>
            <Switch
              id={`ai-mode-${id}`}
              checked={aiMode}
              onCheckedChange={setAiMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {aiMode ? (
            <Button
              size="sm"
              variant={isAnnouncementPlaying ? 'default' : isCached ? 'secondary' : 'outline'}
              onClick={generateAnnouncement}
              disabled={isGenerating}
              className={`h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                isAnnouncementPlaying ? 'bg-primary text-black animate-pulse shadow-[0_0_15px_rgba(100,255,0,0.5)]' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                  GEN...
                </>
              ) : isAnnouncementPlaying ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  PLAYING
                </>
              ) : isCached ? (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  READY
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  GENERATE
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={toggleRecording}
              disabled={isUploading}
              className="h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-tighter"
            >
              {isRecording ? (
                <>
                  <MicOff className="w-3 h-3 mr-1" />
                  STOP
                </>
              ) : isUploading ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                  SAVING...
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 mr-1" />
                  START REC
                </>
              )}
            </Button>
          )}
        </div>

        {/* Card Header - Black/Panthers Aesthetic */}
        <div className="bg-black p-6 text-center relative overflow-hidden">
          {/* Faded Panther Background or Design Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="flex justify-center mb-4 relative z-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary shadow-[0_0_20px_rgba(100,255,0,0.2)]">
              <Music className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Player Number */}
          <div className="mb-2 relative z-10">
            {isEditingNumber ? (
              <Input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onBlur={() => setIsEditingNumber(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingNumber(false)}
                placeholder="00"
                className="w-24 mx-auto text-center text-4xl font-black bg-white/5 border-primary/30 text-primary placeholder:text-white/20 focus:ring-2 focus:ring-primary h-16"
                maxLength={2}
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingNumber(true)}
                className="text-7xl font-black text-white italic tracking-tighter hover:text-primary transition-all cursor-pointer drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] outline-text-primary"
                style={{ WebkitTextStroke: '1px rgba(100,255,0,0.3)' }}
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
                placeholder="Player Name"
                className="text-xl font-bold bg-white/5 border-primary/30 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary text-center h-12"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-2xl font-black text-primary uppercase tracking-tight hover:scale-105 transition-transform cursor-pointer block w-full truncate italic"
              >
                {name || 'ADD NAME'}
              </button>
            )}
          </div>
        </div>

        {/* Walkup Music Controls */}
        <div className="p-6 space-y-4 bg-zinc-900/50">
          {audioUrl ? (
            <>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePlay}
                  className={`flex-1 h-14 rounded-xl font-black uppercase italic tracking-wider transition-all duration-300 ${
                    isPlaying
                      ? 'bg-primary text-black shadow-[0_0_20px_rgba(100,255,0,0.4)] scale-[1.02]'
                      : 'bg-zinc-800 hover:bg-primary hover:text-black text-primary border border-primary/20'
                  }`}
                >
                  {isPlaying ? (
                    <><Pause className="w-6 h-6 mr-2 fill-current" />PLAYING...</>
                  ) : (
                    <><Play className="w-6 h-6 mr-2 fill-current" />WALKUP</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRemoveAudio}
                  className="h-14 w-14 rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Audio Loaded
              </div>
            </>
          ) : (
            <div className="space-y-3">
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
                className="w-full h-14 rounded-xl border-dashed border-2 border-primary/20 hover:border-primary/60 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary font-bold uppercase text-[10px] tracking-widest"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    UPLOADING...
                  </>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />UPLOAD WALKUP</>
                )}
              </Button>
              <p className="text-[10px] font-medium text-center text-muted-foreground/60 uppercase">
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

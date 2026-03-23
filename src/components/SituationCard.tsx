import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Play, Pause, X, Music } from 'lucide-react'
import { blink } from '@/lib/blink'
import toast from 'react-hot-toast'

interface SituationCardProps {
  id: string
  initialDescription?: string
}

export function SituationCard({ id, initialDescription = '' }: SituationCardProps) {
  const [description, setDescription] = useState(() => {
    const saved = localStorage.getItem(`situation-description-${id}`)
    return saved !== null ? saved : initialDescription
  })
  const [audioUrl, setAudioUrl] = useState(() => {
    const saved = localStorage.getItem(`situation-audioUrl-${id}`)
    return saved !== null ? saved : ''
  })
  const [audioFileName, setAudioFileName] = useState(() => {
    const saved = localStorage.getItem(`situation-audioFileName-${id}`)
    return saved !== null ? saved : ''
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(!description)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(`situation-description-${id}`, description)
  }, [description, id])

  useEffect(() => {
    localStorage.setItem(`situation-audioUrl-${id}`, audioUrl)
  }, [audioUrl, id])

  useEffect(() => {
    localStorage.setItem(`situation-audioFileName-${id}`, audioFileName)
  }, [audioFileName, id])

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
      const path = `situation-${safeId}-${Date.now()}.${ext}`
      const { publicUrl } = await blink.storage.upload(file, path)
      setAudioUrl(publicUrl)
      setAudioFileName(file.name)
      toast.success('Music uploaded!')
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

  return (
    <Card className="group relative overflow-hidden border border-primary/10 hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(100,255,0,0.1)] bg-card/50">
      <CardContent className="p-3">
        {/* Description Field */}
        <div className="mb-3">
          {isEditingDescription ? (
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setIsEditingDescription(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingDescription(false)}
              placeholder="Situation (e.g. Strikeout)"
              className="text-xs font-bold bg-white/5 border-primary/30 text-white text-center h-8"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="text-xs font-black text-primary uppercase tracking-tight hover:scale-105 transition-transform cursor-pointer block w-full truncate italic text-center"
            >
              {description || 'ADD SITUATION'}
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-2">
          {audioUrl ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePlay}
                  size="sm"
                  className={`flex-1 h-9 rounded-lg font-black uppercase italic tracking-wider text-[10px] ${
                    isPlaying
                      ? 'bg-primary text-black'
                      : 'bg-zinc-800 hover:bg-primary hover:text-black text-primary border border-primary/20'
                  }`}
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRemoveAudio}
                  className="h-9 w-9 rounded-lg border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-full px-1">
                <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
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
                className="w-full h-9 rounded-lg border-dashed border border-primary/20 hover:border-primary/60 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary font-bold uppercase text-[8px] tracking-widest"
              >
                {isUploading ? '...' : 'UPLOAD MUSIC'}
              </Button>
            </div>
          )}
        </div>

        {/* Audio Element */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} />
        )}
      </CardContent>
    </Card>
  )
}

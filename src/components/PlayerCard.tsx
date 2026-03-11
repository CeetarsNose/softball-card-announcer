import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Play, Pause, X, Music } from 'lucide-react'
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Audio file must be less than 10MB')
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

  return (
    <Card className="group relative overflow-hidden border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-gradient-to-br from-card to-muted/30">
      <CardContent className="p-0">
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

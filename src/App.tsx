import { useState } from 'react'
import { PlayerCard } from '@/components/PlayerCard'
import { SituationCard } from '@/components/SituationCard'
import { Button } from '@/components/ui/button'
import { Plus, Volume2, Trophy, X, Music, Bluetooth } from 'lucide-react'
import toast from 'react-hot-toast'

function App() {
  const [playerCount, setPlayerCount] = useState(9)
  const [situationCount, setSituationCount] = useState(4)

  const playerIds = Array.from({ length: playerCount }, (_, i) => `player-${i + 1}`)
  const situationIds = Array.from({ length: situationCount }, (_, i) => `situation-${i + 1}`)

  const handleBluetoothPairing = async () => {
    // Check for Audio Output Devices API support
    if ('mediaDevices' in navigator && 'selectAudioOutput' in (navigator.mediaDevices as any)) {
      try {
        // @ts-ignore
        await (navigator.mediaDevices as any).selectAudioOutput()
        toast.success('Audio output selection opened')
      } catch (err: any) {
        if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
          console.error('Error selecting audio output:', err)
          toast.error('Could not open audio output selection')
        }
      }
    } else {
      toast.error('Browser device selection not supported. Please use OS settings to pair Bluetooth.', {
        duration: 5000,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="relative bg-black border-b-4 border-primary py-4 px-4 shadow-2xl overflow-hidden">
        {/* Subtle Background Pattern or Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(100,255,0,0.1)_0%,transparent_70%)]" />
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary rounded-full blur opacity-30 animate-pulse" />
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2F7ASEOAUzjMOUgg2OYMCUtsHE5ZA2%2Fpanther__d14a9641.jpg?alt=media&token=22f18f29-292a-49c7-9d38-5c64a040a9ea" 
                alt="Midland Park Panthers" 
                className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-full border-2 border-primary bg-black"
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
                Midland Park <span className="text-primary">Softball</span>
              </h1>
              <p className="text-xl md:text-2xl font-black text-primary tracking-widest uppercase italic mt-1">
                Walkup Music
              </p>
            </div>
          </div>

          <Button
            onClick={handleBluetoothPairing}
            className="bg-zinc-900 border border-primary/30 text-primary hover:bg-primary hover:text-black font-black uppercase italic tracking-wider rounded-xl h-12 px-6 transition-all group"
          >
            <Bluetooth className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Pair Bluetooth Speaker
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        {/* Banner Strip */}
        <div className="bg-primary text-black py-1.5 px-4 mb-8 transform -skew-x-12 shadow-[0_5px_15px_rgba(100,255,0,0.2)]">
          <p className="text-center font-black uppercase tracking-[0.3em] italic text-xs animate-pulse">
            Official Walkup Music Controller
          </p>
        </div>

        {/* Instructions - More compact */}
        <div className="bg-zinc-900 rounded-xl p-4 mb-8 shadow-2xl border-l-4 border-primary overflow-hidden relative">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
                Game Day <span className="text-primary">Operations</span>
              </h3>
            </div>
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 ml-auto">
              {[
                { label: 'EDIT PLAYER', desc: 'Tap Number/Name' },
                { label: 'AI ANNOUNCE', desc: 'Auto-voice' },
                { label: 'CUSTOM AUDIO', desc: 'Upload/Record' },
                { label: 'INSTANT PLAY', desc: 'Launch music' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col border-l border-primary/20 pl-3 py-0.5">
                  <span className="text-[10px] font-black text-primary tracking-widest leading-tight">{item.label}</span>
                  <span className="text-[10px] font-medium text-zinc-400 italic leading-tight">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Player Cards */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
                Player <span className="text-primary">Roster</span>
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Players</p>
                <div className="flex items-center bg-black border border-primary/20 rounded-lg p-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => playerCount > 1 && setPlayerCount(prev => prev - 1)}
                    className="h-7 w-7 text-primary hover:bg-primary/10"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-black text-white italic">{playerCount}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => playerCount < 20 && setPlayerCount(prev => prev + 1)}
                    className="h-7 w-7 text-primary hover:bg-primary/10"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Player Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6">
              {playerIds.map((id, index) => (
                <div
                  key={id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <PlayerCard id={id} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Situation Cards */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
                Game <span className="text-primary">SFX</span>
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => situationCount < 12 && setSituationCount(prev => prev + 1)}
                  className="h-7 w-7 text-primary border border-primary/20 hover:bg-primary/10"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {situationIds.map((id, index) => (
                <div
                  key={id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(index + playerCount) * 30}ms` }}
                >
                  <SituationCard id={id} />
                </div>
              ))}
            </div>

            {situationCount > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSituationCount(prev => prev - 1)}
                className="w-full mt-4 text-[9px] font-black uppercase text-destructive/50 hover:text-destructive hover:bg-destructive/5"
              >
                Remove Last SFX Card
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 pt-6 border-t border-primary/10 flex justify-center">
          <Button
            size="sm"
            onClick={() => setPlayerCount(prev => Math.min(prev + 1, 20))}
            className="rounded-lg h-10 px-8 bg-primary hover:bg-primary-glow text-black font-black uppercase italic tracking-wider shadow-[0_0_15px_rgba(100,255,0,0.2)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Player
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-primary/5 bg-black/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Panthers Softball League</span>
          </div>
          <p className="text-muted-foreground text-xs font-medium italic">
            Designed for Midland Park game day excellence.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

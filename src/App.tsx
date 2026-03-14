import { useState } from 'react'
import { PlayerCard } from '@/components/PlayerCard'
import { Button } from '@/components/ui/button'
import { Plus, Volume2, Trophy, X } from 'lucide-react'

function App() {
  const [playerCount, setPlayerCount] = useState(9)

  const playerIds = Array.from({ length: playerCount }, (_, i) => `player-${i + 1}`)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="relative bg-black border-b-4 border-primary py-8 px-4 shadow-2xl overflow-hidden">
        {/* Subtle Background Pattern or Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(100,255,0,0.1)_0%,transparent_70%)]" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary rounded-full blur opacity-30 animate-pulse" />
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/blink-451505.firebasestorage.app/o/user-uploads%2F7ASEOAUzjMOUgg2OYMCUtsHE5ZA2%2Fpanther__d14a9641.jpg?alt=media&token=22f18f29-292a-49c7-9d38-5c64a040a9ea" 
                alt="Midland Park Panthers" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-full border-4 border-primary bg-black"
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                Midland Park <span className="text-primary">Softball</span>
              </h1>
              <p className="text-2xl md:text-4xl font-black text-primary tracking-widest uppercase italic mt-1">
                Walkup Music
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Banner Strip */}
        <div className="bg-primary text-black py-2 px-4 mb-12 transform -skew-x-12 shadow-[0_5px_15px_rgba(100,255,0,0.3)]">
          <p className="text-center font-black uppercase tracking-[0.5em] italic animate-pulse">
            Official Walkup Music Controller
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-zinc-900 rounded-2xl p-8 mb-12 shadow-2xl border-l-8 border-primary overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-24 h-24 text-white" />
          </div>
          <div className="flex items-start gap-6 relative z-10">
            <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
              <Volume2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">
                Game Day <span className="text-primary">Operations</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[
                  { label: 'EDIT PLAYER', desc: 'Tap Number/Name to customize card' },
                  { label: 'AI ANNOUNCE', desc: 'Auto-generate "Now Batting" voice' },
                  { label: 'CUSTOM AUDIO', desc: 'Upload or Record walkup tracks' },
                  { label: 'INSTANT PLAY', desc: 'Launch music with a single tap' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col border-l-2 border-primary/20 pl-4 py-1 hover:border-primary transition-colors">
                    <span className="text-xs font-black text-primary tracking-widest">{item.label}</span>
                    <span className="text-sm font-medium text-zinc-400 italic">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Player Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {playerIds.map((id, index) => (
            <div
              key={id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PlayerCard id={id} />
            </div>
          ))}
        </div>

        {/* Add/Remove Players */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-16 pt-12 border-t border-primary/10">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Roster Size</p>
            <div className="flex items-center bg-black border border-primary/20 rounded-xl p-1 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => playerCount > 1 && setPlayerCount(prev => prev - 1)}
                className="h-10 w-10 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <X className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center text-xl font-black text-white italic">{playerCount}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => playerCount < 15 && setPlayerCount(prev => prev + 1)}
                className="h-10 w-10 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button
            size="lg"
            onClick={() => setPlayerCount(prev => Math.min(prev + 1, 15))}
            className="rounded-xl h-14 px-8 bg-primary hover:bg-primary-glow text-black font-black uppercase italic tracking-wider shadow-[0_0_20px_rgba(100,255,0,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add New Player Card
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
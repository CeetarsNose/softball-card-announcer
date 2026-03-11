import { useState } from 'react'
import { PlayerCard } from '@/components/PlayerCard'
import { Button } from '@/components/ui/button'
import { Plus, Volume2, Trophy } from 'lucide-react'

function App() {
  const [playerCount, setPlayerCount] = useState(9)

  const playerIds = Array.from({ length: playerCount }, (_, i) => `player-${i + 1}`)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
      {/* Header */}
      <header className="bg-gradient-to-r from-secondary to-secondary/90 text-white py-6 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-accent rounded-xl shadow-lg">
              <Trophy className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Softball Card Announcer
            </h1>
          </div>
          <p className="text-center text-white/70 text-lg max-w-2xl mx-auto">
            Create personalized player cards with custom names, numbers, and walkup music for your lineup announcements
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Instructions */}
        <div className="bg-card rounded-2xl p-6 mb-8 shadow-md border border-border/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">How to Use</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Tap on the number to set the player's jersey number</li>
                <li>Tap on the name to add or edit the player's name</li>
                <li>Click "Upload Walkup Music" to add audio for each player</li>
                <li>Press play to hear the walkup music during games</li>
              </ol>
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
        <div className="flex justify-center gap-4">
          {playerCount > 1 && (
            <Button
              variant="outline"
              onClick={() => setPlayerCount(prev => prev - 1)}
              className="rounded-full px-6"
            >
              Remove Player
            </Button>
          )}
          {playerCount < 15 && (
            <Button
              onClick={() => setPlayerCount(prev => prev + 1)}
              className="rounded-full px-6 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-sm">
        <p>Perfect for lineup announcements and game day energy</p>
      </footer>
    </div>
  )
}

export default App

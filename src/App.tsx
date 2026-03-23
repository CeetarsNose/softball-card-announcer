import { useState, useEffect } from 'react'
import { PlayerCard } from '@/components/PlayerCard'
import { SituationCard } from '@/components/SituationCard'
import { Button } from '@/components/ui/button'
import { Plus, Volume2, Trophy, X, Music, Bluetooth, Edit2, Check, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

interface Team {
  id: string
  name: string
  playerCount: number
  situationCount: number
}

function App() {
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('softball-teams')
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Panthers', playerCount: 9, situationCount: 4 }]
  })
  const [activeTeamId, setActiveTeamId] = useState(() => {
    const saved = localStorage.getItem('softball-active-team-id')
    return saved || 'default'
  })
  const [isEditingTeamName, setIsEditingTeamName] = useState(false)
  const [tempTeamName, setTempTeamName] = useState('')

  useEffect(() => {
    localStorage.setItem('softball-teams', JSON.stringify(teams))
  }, [teams])

  useEffect(() => {
    localStorage.setItem('softball-active-team-id', activeTeamId)
  }, [activeTeamId])

  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0]

  const playerIds = Array.from({ length: activeTeam.playerCount }, (_, i) => `${activeTeam.id}-player-${i + 1}`)
  const situationIds = Array.from({ length: activeTeam.situationCount }, (_, i) => `${activeTeam.id}-situation-${i + 1}`)

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

  const handleAddTeam = () => {
    const newId = `team-${Date.now()}`
    const newTeam: Team = {
      id: newId,
      name: `New Team ${teams.length + 1}`,
      playerCount: 9,
      situationCount: 4
    }
    setTeams([...teams, newTeam])
    setActiveTeamId(newId)
    toast.success('New team configuration created')
  }

  const handleDeleteTeam = (id: string) => {
    if (teams.length <= 1) {
      toast.error('You must have at least one team')
      return
    }
    const updatedTeams = teams.filter(t => t.id !== id)
    setTeams(updatedTeams)
    if (activeTeamId === id) {
      setActiveTeamId(updatedTeams[0].id)
    }
    toast.success('Team deleted')
  }

  const handleUpdateTeamName = () => {
    if (!tempTeamName.trim()) return
    setTeams(teams.map(t => t.id === activeTeamId ? { ...t, name: tempTeamName } : t))
    setIsEditingTeamName(false)
  }

  const updatePlayerCount = (delta: number) => {
    setTeams(teams.map(t => {
      if (t.id === activeTeamId) {
        const newCount = Math.max(1, Math.min(20, t.playerCount + delta))
        return { ...t, playerCount: newCount }
      }
      return t
    }))
  }

  const updateSituationCount = (delta: number) => {
    setTeams(teams.map(t => {
      if (t.id === activeTeamId) {
        const newCount = Math.max(1, Math.min(12, t.situationCount + delta))
        return { ...t, situationCount: newCount }
      }
      return t
    }))
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
                Softball <span className="text-primary">Announcer</span>
              </h1>
              <p className="text-xl md:text-2xl font-black text-primary tracking-widest uppercase italic mt-1">
                Walkup Music Manager
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={handleBluetoothPairing}
              className="bg-zinc-900 border border-primary/30 text-primary hover:bg-primary hover:text-black font-black uppercase italic tracking-wider rounded-xl h-12 px-6 transition-all group w-full sm:w-auto"
            >
              <Bluetooth className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Pair Speaker
            </Button>
            <Button
              onClick={handleAddTeam}
              className="bg-primary hover:bg-primary-glow text-black font-black uppercase italic tracking-wider rounded-xl h-12 px-6 shadow-[0_0_15px_rgba(100,255,0,0.2)] w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Team
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        {/* Banner Strip */}
        <div className="bg-primary text-black py-1.5 px-4 mb-8 transform -skew-x-12 shadow-[0_5px_15px_rgba(100,255,0,0.2)]">
          <p className="text-center font-black uppercase tracking-[0.3em] italic text-xs animate-pulse">
            Game Day Music & Announcement Console
          </p>
        </div>

        {/* Team Tabs */}
        <Tabs value={activeTeamId} onValueChange={setActiveTeamId} className="w-full mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <TabsList className="bg-black border border-primary/20 p-1 h-auto flex-wrap justify-center">
              {teams.map(team => (
                <TabsTrigger 
                  key={team.id} 
                  value={team.id}
                  className="px-6 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black italic"
                >
                  {team.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-3 bg-zinc-900 border border-primary/10 rounded-xl px-4 py-2">
              {isEditingTeamName ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={tempTeamName}
                    onChange={(e) => setTempTeamName(e.target.value)}
                    className="h-8 w-40 text-xs font-black uppercase italic bg-black border-primary/30"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTeamName()}
                  />
                  <Button size="icon" variant="ghost" onClick={handleUpdateTeamName} className="h-8 w-8 text-primary">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingTeamName(false)} className="h-8 w-8 text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-black text-white uppercase italic tracking-wider">{activeTeam.name}</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-primary/60 hover:text-primary"
                      onClick={() => {
                        setTempTeamName(activeTeam.name)
                        setIsEditingTeamName(true)
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive/40 hover:text-destructive"
                      onClick={() => handleDeleteTeam(activeTeam.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {teams.map(team => (
            <TabsContent key={team.id} value={team.id} className="mt-0 outline-none">
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
                          onClick={() => updatePlayerCount(-1)}
                          className="h-7 w-7 text-primary hover:bg-primary/10"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-black text-white italic">{team.playerCount}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updatePlayerCount(1)}
                          className="h-7 w-7 text-primary hover:bg-primary/10"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Player Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6">
                    {Array.from({ length: team.playerCount }).map((_, index) => {
                      const cardId = `${team.id}-player-${index + 1}`
                      return (
                        <div
                          key={cardId}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <PlayerCard id={cardId} />
                        </div>
                      )
                    })}
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
                        onClick={() => updateSituationCount(1)}
                        className="h-7 w-7 text-primary border border-primary/20 hover:bg-primary/10"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    {Array.from({ length: team.situationCount }).map((_, index) => {
                      const cardId = `${team.id}-situation-${index + 1}`
                      return (
                        <div
                          key={cardId}
                          className="animate-fade-in"
                          style={{ animationDelay: `${(index + team.playerCount) * 30}ms` }}
                        >
                          <SituationCard id={cardId} />
                        </div>
                      )
                    })}
                  </div>

                  {team.situationCount > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateSituationCount(-1)}
                      className="w-full mt-4 text-[9px] font-black uppercase text-destructive/50 hover:text-destructive hover:bg-destructive/5"
                    >
                      Remove Last SFX Card
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Bottom Actions */}
        <div className="mt-8 pt-6 border-t border-primary/10 flex justify-center">
          <Button
            size="sm"
            onClick={() => updatePlayerCount(1)}
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

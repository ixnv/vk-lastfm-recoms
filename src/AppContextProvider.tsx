import * as React from 'react'
import { useState } from 'react'
import { Track } from './shared'
import { none, Option, some } from 'fp-ts/lib/Option'

export type AppState = {
  maybeTrack: Option<Track>
  opened: boolean
  minimized: boolean
  loading: boolean
  setTrack (track: Track): void
  setDialogOpened (opened: boolean): void
  setMinimized (minimized: boolean): void
  setLoading (loading: boolean): void
}

const defaultValue: AppState = {
  maybeTrack: none,
  opened: false,
  minimized: false,
  loading: false,
  setTrack: (track: Track): void => {
    defaultValue.maybeTrack = some(track)
  },
  setDialogOpened (opened: boolean): void {
    defaultValue.setDialogOpened(opened)
  },
  setMinimized (minimized: boolean): void {
    defaultValue.minimized = minimized
  },
  setLoading (loading: boolean): void {
    defaultValue.loading = loading
  }
}

const AppContext = React.createContext(defaultValue)

export const AppContextProvider: React.FC = ({ children }) => {
  const [maybeTrack, setTrack] = useState<Option<Track>>(none)
  const [opened, setDialogOpened] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [loading, setLoading] = useState(false)
  const providedState = {
    maybeTrack,
    opened,
    minimized,
    loading,
    setTrack: (track: Track) => setTrack(some(track)),
    setDialogOpened: (opened: boolean) => setDialogOpened(opened),
    setMinimized: (minimized: boolean) => setMinimized(minimized),
    setLoading: (loading: boolean) => setLoading(loading)
  }

  return (
    <AppContext.Provider value={providedState}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext

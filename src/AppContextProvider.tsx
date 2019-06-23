import * as React from 'react'
import {useState} from 'react'
import {Track} from './types'

export type AppState = {
    track: Track // TODO: replace with fp-ts/lib/Option
    dialogOpened: boolean
    updateTrack: (track: Track) => void
    updateDialogOpened: (dialogOpened: boolean) => void
}

const defaultValue: AppState = {
    dialogOpened: false,
    track: {
        title: '',
        artist: ''
    },
    updateTrack: (track: Track) => {
        defaultValue.track = track
    },
    updateDialogOpened: (dialogOpened: boolean): void => {
        defaultValue.dialogOpened = dialogOpened
    }
}

const AppContext = React.createContext(defaultValue)

export const AppContextProvider: React.FC = ({children}) => {
    const [track, setTrack] = useState({
        title: '',
        artist: ''
    })
    const [dialogOpened, setDialogOpened] = useState(false)
    const providedState = {
        track,
        dialogOpened,
        updateTrack: (newTrack: Track) => setTrack(newTrack),
        updateDialogOpened: (opened: boolean) => setDialogOpened(opened)
    }

    return (
        <AppContext.Provider value={providedState}>
            {children}
        </AppContext.Provider>
    )
}

export default AppContext
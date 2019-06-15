import * as React from 'react'
import ResultDialog from './components/ResultDialog'
import ResultMinimized from './components/ResultMinimized'
import {AppContextProvider} from './AppContextProvider'

export const App = () => (
    <AppContextProvider>
        <ResultDialog/>
        <ResultMinimized/>
    </AppContextProvider>
)

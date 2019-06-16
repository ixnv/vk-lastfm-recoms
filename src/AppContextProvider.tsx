import * as React from 'react'
import {Track} from './types'

type DefaultState = {
    track?: Track
    openModal: boolean
}

export type BehaviouralState = DefaultState & {
    setTrack: (track: Track) => void,
    setOpenModal: (openModal: boolean) => void
}

const defaultValue: DefaultState = {
    openModal: false,
    track: undefined
}

const AppContext = React.createContext(defaultValue)

export class AppContextProvider extends React.PureComponent {
    public state: BehaviouralState = {
        track: undefined,
        openModal: false,
        setTrack: (track: Track): void => {
            this.setState({track})
        },
        setOpenModal: (openModal: boolean): void => {
            this.setState({openModal})
        }
    }

    public render() {
        return (
            <AppContext.Provider value={this.state}>
                {this.props.children}
            </AppContext.Provider>
        )
    }
}

export default AppContext
import * as React from 'react'
import {Track} from './types'

const AppContext = React.createContext({})

export type State = {
    track?: Track,
    setTrack: (track: Track) => void,
    openModal: boolean,
    setOpenModal: (openModal: boolean) => void
}

export class AppContextProvider extends React.PureComponent {
    public state: State = {
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
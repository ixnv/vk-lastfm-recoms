import {SyntheticEvent, useContext} from 'react'
import React from 'react'
import styled from 'styled-components'
import {wrapperClass} from '../../shared'
import AppContext from '../../AppContextProvider'

const BackdropSC = styled.div`
    position: fixed;
    z-index: 550;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
`

const backdropClass = `${wrapperClass}-backdrop`

const Backdrop: React.FC = ({children}) => {
    const {setDialogOpened} = useContext(AppContext)
    const backdropClose = (e: SyntheticEvent) => {
        const target = e.target as HTMLDivElement
        if (target.classList.contains(backdropClass)) {
            close()
        }
    }

    const close = () => {
        setDialogOpened(false)
    }
    const closeOnEsc = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Escape') {
            close()
        }
    }

    return (
        <BackdropSC onClick={backdropClose} className={backdropClass} onKeyUp={closeOnEsc}>
            {children}
        </BackdropSC>
    )
}

export default Backdrop
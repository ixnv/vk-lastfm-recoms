import React from 'react'
import {useContext} from 'react'
import styled from 'styled-components'
import Action from './Action.sc'
import AppContext from '../../AppContextProvider'

const CloseButtonSC = styled(Action)`
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2236%22%20height%3D%2236%22%20viewBox%3D%22940%20104%2036%2036%22%3E%3Cg%20style%3D%22fill%3Anone%3B%22%3E%3Crect%20x%3D%22940%22%20y%3D%22104%22%20width%3D%2236%22%20height%3D%2236%22%2F%3E%3Cg%20fill%3D%22%23FFF%22%3E%3Cpath%20d%3D%22M968.1%20129.9L950.1%20111.9C949.5%20111.4%20948.5%20111.4%20947.9%20111.9%20947.4%20112.5%20947.4%20113.5%20947.9%20114.1L965.9%20132.1C966.5%20132.6%20967.5%20132.6%20968.1%20132.1%20968.6%20131.5%20968.6%20130.5%20968.1%20129.9Z%22%2F%3E%3Cpath%20d%3D%22M950.1%20132.1L968.1%20114.1C968.6%20113.5%20968.6%20112.5%20968.1%20111.9%20967.5%20111.4%20966.5%20111.4%20965.9%20111.9L947.9%20129.9C947.4%20130.5%20947.4%20131.5%20947.9%20132.1%20948.5%20132.6%20949.5%20132.6%20950.1%20132.1Z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E") no-repeat 50%;
    top: 0;
`

const CloseButton: React.FC = () => {
    const {setDialogOpened} = useContext(AppContext)
    const close = () => {
        setDialogOpened(false)
    }

    return (
        <CloseButtonSC onClick={close}/>
    )
}

export default CloseButton

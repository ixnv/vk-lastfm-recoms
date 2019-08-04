import React from 'react'
import {useContext} from 'react'
import styled from 'styled-components'
import Action from './Action.sc'
import AppContext from '../../AppContextProvider'

const MinimizeButtonSC = styled(Action)`
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2236%22%20height%3D%2236%22%20viewBox%3D%220%200%2036%2036%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20clip-path%3D%22url(%23clip0)%22%3E%3Cpath%20d%3D%22M6.0796%2025.2444L29.1178%2025.3331C29.8215%2025.2749%2030.4589%2024.6681%2030.52%2023.9982C30.4532%2023.3277%2029.8107%2022.716%2029.1065%2022.6524L6.06825%2022.5637C5.36456%2022.6219%204.72719%2023.2287%204.66605%2023.8986C4.73289%2024.569%205.3754%2025.1807%206.0796%2025.2444Z%22%20fill%3D%22white%22%2F%3E%3C%2Fg%3E%3Cdefs%3E%3CclipPath%20id%3D%22clip0%22%3E%3Crect%20width%3D%2236%22%20height%3D%2236%22%20fill%3D%22white%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E") no-repeat 50%;
    top: 40px;
    height: 30px;
`

const MinimizeButton: React.FC = () => {
    const {setDialogOpened, setMinimized} = useContext(AppContext)
    const minimize = () => {
        setMinimized(true)
        setDialogOpened(false)
    }

    return (
        <MinimizeButtonSC onClick={minimize}/>
    )
}

export default MinimizeButton

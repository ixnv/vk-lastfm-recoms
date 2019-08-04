import React from 'react'
import styled from 'styled-components'
import AppContext from '../AppContextProvider'
import {useContext} from 'react'
import {getOrElse, isNone} from 'fp-ts/lib/Option'
import {pipe} from 'fp-ts/lib/pipeable'
import {defaultTrack} from '../shared'

const Wrapper = styled.div`
    position: fixed;
    right: 1%;
    top: 30%;
    max-width: 300px;
    height: 65px;
    box-shadow: #8b939a 0 0 5px 1px;
    border-radius: 3px;
    background: #fff;
    border: 1px solid rgb(230, 237, 245);
`

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    margin: 5px 7px 0;
`

const Action = styled.div`
    width: 12px;
    height: 12px;
    margin-left: 5px;
    cursor: pointer;
    display: inline-block;
    
    &:hover svg > path {
      fill: #8A8A8A;
    }
`

const CloseButton = styled(Action)``
const MaximizeButton = styled(Action)``

const Info = styled.div`
    padding: 0 10px;
    line-height: 35px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const ResultMinimized: React.FC = () => {
    const {maybeTrack, minimized, setMinimized, setDialogOpened} = useContext(AppContext)

    if (isNone(maybeTrack) || !minimized) {
        return null
    }

    const maximize = () => {
        setMinimized(false)
        setDialogOpened(true)
    }

    const close = () => {
        setMinimized(false)
    }

    const track = pipe(maybeTrack, getOrElse(() => defaultTrack))

    return (
        <>
            <Wrapper>
                <Actions>
                    <MaximizeButton onClick={maximize}>
                        <svg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path
                                d='M0 3.2C0 2.07989 0 1.51984 0.217987 1.09202C0.409734 0.715695 0.715695 0.409734 1.09202 0.217987C1.51984 0 2.0799 0 3.2 0H8.8C9.92011 0 10.4802 0 10.908 0.217987C11.2843 0.409734 11.5903 0.715695 11.782 1.09202C12 1.51984 12 2.07989 12 3.2V4.8H9H6H0V3.2Z'
                                fill='#C4C4C4'/>
                            <path d='M0 4.8H1.71429V12C0.767512 12 0 11.2325 0 10.2857V4.8Z' fill='#C4C4C4'/>
                            <path d='M10.2857 4.8H12V10.2857C12 11.2325 11.2325 12 10.2857 12V4.8Z' fill='#C4C4C4'/>
                            <path d='M1.71429 10.2857H10.2857V12H1.71429V10.2857Z' fill='#C4C4C4'/>
                        </svg>
                    </MaximizeButton>
                    <CloseButton onClick={close}>
                        <svg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path
                                d='M0.314028 1.83029C-0.104676 1.41158 -0.104676 0.732731 0.314028 0.314028C0.732731 -0.104676 1.41158 -0.104676 1.83029 0.314028L11.686 10.1697C12.1047 10.5884 12.1047 11.2673 11.686 11.686C11.2673 12.1047 10.5884 12.1047 10.1697 11.686L0.314028 1.83029Z'
                                fill='#C4C4C4'/>
                            <path
                                d='M10.1697 0.314028C10.5884 -0.104676 11.2673 -0.104676 11.686 0.314028C12.1047 0.732731 12.1047 1.41158 11.686 1.83029L1.83029 11.686C1.41158 12.1047 0.732731 12.1047 0.314028 11.686C-0.104676 11.2673 -0.104676 10.5884 0.314028 10.1697L10.1697 0.314028Z'
                                fill='#C4C4C4'/>
                        </svg>
                    </CloseButton>
                </Actions>
                <Info>Похожие на <strong>{track.artist} &mdash; {track.title}</strong></Info>
            </Wrapper>
        </>
    )
}

export default ResultMinimized

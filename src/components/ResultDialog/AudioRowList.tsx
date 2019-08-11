import React, {useContext, useEffect, useRef} from 'react'
import {Track} from '../../shared'
import {searchTrack} from '../../api/vk'
import {pipe} from 'fp-ts/lib/pipeable'
import {fold} from 'fp-ts/lib/Option'
import AppContext from '../../AppContextProvider'
import styled from 'styled-components'

type Props = {
    tracks: Track[]
}

const Component = styled.div`
    padding: 8px 0;
`

const AudioRowList: React.FC<Props> = ({tracks}) => {
    const {setLoading} = useContext(AppContext)

    const audioListRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        tracks.forEach(async (recommendedTrack: Track, index) => {
            pipe(await searchTrack(recommendedTrack), fold(
                () => null,
                vkTrack => {
                    audioListRef!.current!.appendChild(vkTrack)
                }
            ))

            if (index === tracks.length - 1) {
                setLoading(false)
            }
        })
    }, [])

    return (
        <Component ref={audioListRef}/>
    )
}

export default AudioRowList

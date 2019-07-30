import * as React from 'react'
import {SyntheticEvent, useContext, useEffect, useState} from 'react'
import styled from 'styled-components'
import {fold, getOrElse, isNone} from 'fp-ts/lib/Option'
import {pipe} from 'fp-ts/lib/pipeable'
import Loader from './Loader'
import AppContext from '../AppContextProvider'
import {getRecommendations, RecommendationsResponse} from '../api/recommendations'
import {searchTrack} from '../api/vk'
import {defaultTrack, Track, wrapperClass} from '../shared'
import {randomId} from '../util'

const Backdrop = styled.div`
    position: fixed;
    z-index: 550;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
`

const Dialog = styled.div`
    position: relative;
    z-index: 999;
    margin: 25px auto 10px;
    width: 560px;
    min-height: 300px;
    background-color: white;
    border-radius: 3px;
`

const Content = styled.div`
    padding: 10px;
`

const Info = styled.h3`
    padding: 0 10px;
`

const AudioRowList = styled.div`
    padding: 8px 0;
`

const NoResult = styled.div`
    text-align: center;
    height: 10em;
    line-height: 10em;
`

const Error = styled.div`
    text-align: center;
    height: 10em;
    padding: 5em 0 0 0;
`

const RetryButton = styled.button`
    margin-top: 1em;
`

const Action = styled.button`
    position: absolute;
    right: -60px;
    width: 60px;
    height: 50px;
    cursor: pointer;
    border: none;
    opacity: 0.5;
    transition: opacity 60ms linear;
    
    &:hover {
        opacity: 1;
    }
`

const CloseButton = styled(Action)`
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2236%22%20height%3D%2236%22%20viewBox%3D%22940%20104%2036%2036%22%3E%3Cg%20style%3D%22fill%3Anone%3B%22%3E%3Crect%20x%3D%22940%22%20y%3D%22104%22%20width%3D%2236%22%20height%3D%2236%22%2F%3E%3Cg%20fill%3D%22%23FFF%22%3E%3Cpath%20d%3D%22M968.1%20129.9L950.1%20111.9C949.5%20111.4%20948.5%20111.4%20947.9%20111.9%20947.4%20112.5%20947.4%20113.5%20947.9%20114.1L965.9%20132.1C966.5%20132.6%20967.5%20132.6%20968.1%20132.1%20968.6%20131.5%20968.6%20130.5%20968.1%20129.9Z%22%2F%3E%3Cpath%20d%3D%22M950.1%20132.1L968.1%20114.1C968.6%20113.5%20968.6%20112.5%20968.1%20111.9%20967.5%20111.4%20966.5%20111.4%20965.9%20111.9L947.9%20129.9C947.4%20130.5%20947.4%20131.5%20947.9%20132.1%20948.5%20132.6%20949.5%20132.6%20950.1%20132.1Z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E") no-repeat 50%;
    top: 0;
`

const MinimizeButton = styled(Action)`
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2236%22%20height%3D%2236%22%20viewBox%3D%220%200%2036%2036%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20clip-path%3D%22url(%23clip0)%22%3E%3Cpath%20d%3D%22M6.0796%2025.2444L29.1178%2025.3331C29.8215%2025.2749%2030.4589%2024.6681%2030.52%2023.9982C30.4532%2023.3277%2029.8107%2022.716%2029.1065%2022.6524L6.06825%2022.5637C5.36456%2022.6219%204.72719%2023.2287%204.66605%2023.8986C4.73289%2024.569%205.3754%2025.1807%206.0796%2025.2444Z%22%20fill%3D%22white%22%2F%3E%3C%2Fg%3E%3Cdefs%3E%3CclipPath%20id%3D%22clip0%22%3E%3Crect%20width%3D%2236%22%20height%3D%2236%22%20fill%3D%22white%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E") no-repeat 50%;
    top: 40px;
    height: 30px;
`

const ResultDialog: React.FC = () => {
    const {maybeTrack, opened, setTrack, setDialogOpened, setMinimized} = useContext(AppContext)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [noResult, setNoResult] = useState(false)
    const [vkTracks, setVkTracks] = useState([] as HTMLDivElement[])
    const [canFetchMore, setCanFetchMore] = useState(false)

    useEffect(() => {
        if (isNone(maybeTrack)) {
            return
        }

        setNoResult(false)
        setVkTracks([])
        setLoading(true)
        setCanFetchMore(false)

        const fetchRecommendations = () => {
            return pipe(
                maybeTrack,
                fold(
                    () => Promise.reject(),
                    async (track) => await getRecommendations(track)
                )
            )
        }

        fetchRecommendations().then((recommendResponse: RecommendationsResponse) => {
            if (recommendResponse.error) {
                setError(true)
            }

            if (!recommendResponse.tracks.length) {
                setNoResult(true)
                setLoading(false)
                return
            }

            const recommendedTracks = recommendResponse.tracks
            recommendedTracks.forEach(async (recommendedTrack: Track, index) => {
                const maybeFoundTrack = await searchTrack(recommendedTrack)

                pipe(
                    maybeFoundTrack,
                    fold(
                        () => null,
                        vkTrack => vkTracks.push(vkTrack)
                    )
                )

                if (index === recommendedTracks.length - 1) {
                    setLoading(false)
                    if (!vkTracks.length) {
                        setNoResult(true)
                    } else {
                        setVkTracks(vkTracks)
                        setCanFetchMore(recommendResponse.canFetchMoreTracks)
                    }
                }
            })
        }).catch(() => {
            setLoading(false)
            setError(true)
        })
    }, [maybeTrack])

    const minimize = () => {
        setMinimized(true)
        setDialogOpened(false)
    }
    const close = () => {
        setDialogOpened(false)
        setVkTracks([])
    }
    const closeOnEsc = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key === 'Escape') {
            close()
        }
    }
    const overlayClass = `${wrapperClass}-overlay`
    const overlayClose = (e: SyntheticEvent) => {
        const target = e.target as HTMLDivElement
        if (target.classList.contains(overlayClass)) {
            setVkTracks([])
            setDialogOpened(false)
        }
    }

    const retry = () => {
        pipe(maybeTrack, fold(
            () => null,
            track => {
                setVkTracks([])
                setError(false)
                // a hack way to refresh
                setTrack(track)
            }
        ))
    }

    const track = pipe(
        maybeTrack,
        getOrElse(() => defaultTrack)
    )

    return (
        <>
            {opened &&
            <Backdrop onClick={overlayClose} className={overlayClass} onKeyUp={closeOnEsc}>
                <Dialog tabIndex={0}>
                    <Content>
                        <Info>Похожие на <strong>{track.artist} &mdash; {track.title}</strong></Info>
                        {canFetchMore &&
                        <button className='flat_button button_wide secondary' onClick={retry}>Показать ещё</button>
                        }
                        {loading && <Loader/>}
                        <AudioRowList>
                            {
                                vkTracks.map(vkTrack =>
                                    <div key={randomId()} dangerouslySetInnerHTML={{__html: vkTrack.outerHTML}}/>
                                )
                            }
                        </AudioRowList>
                        {noResult && <NoResult>Ничего не найдено</NoResult>}
                        {error &&
                        <Error>
                            <div>Произошла ошибка</div>
                            <RetryButton className='flat_button' onClick={retry}>Попробовать заново</RetryButton>
                        </Error>
                        }
                    </Content>
                    <CloseButton onClick={close}/>
                    <MinimizeButton onClick={minimize}/>
                </Dialog>
            </Backdrop>
            }
        </>
    )
}

export default ResultDialog

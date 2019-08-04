import React from 'react'
import {useContext, useEffect, useState} from 'react'
import {fold, getOrElse, isNone} from 'fp-ts/lib/Option'
import {pipe} from 'fp-ts/lib/pipeable'
import Loader from './Loader'
import AppContext from '../../AppContextProvider'
import {getRecommendations, RecommendationsResponse} from '../../api/recommendations'
import {searchTrack} from '../../api/vk'
import {defaultTrack, Track} from '../../shared'
import Backdrop from './Backdrop'
import CloseButton from './CloseButton'
import MinimizeButton from './MinimizeButton'
import {AudioRowList, Content, Dialog, Error, Info, NoResult, RetryButton} from './ResultDialog.sc'
import {randomId} from '../../util'

const ResultDialog: React.FC = () => {
    const {maybeTrack, opened, setTrack} = useContext(AppContext)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [noResult, setNoResult] = useState(false)
    const [canFetchMore, setCanFetchMore] = useState(false)
    const [vkTracks, setVkTracks] = useState([] as HTMLDivElement[])

    useEffect(() => {
        if (isNone(maybeTrack)) {
            return
        }

        // wtf
        vkTracks.splice(0)

        setVkTracks([])
        setNoResult(false)
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

                pipe(maybeFoundTrack, fold(
                    () => null,
                    vkTrack =>
                        vkTracks.push(vkTrack)
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

    const retry = () => {
        pipe(maybeTrack, fold(
            () => null,
            track => {
                setError(false)
                // a hack way to refresh
                setTrack(track)
            }
        ))
    }

    const track = pipe(maybeTrack, getOrElse(() => defaultTrack))

    return (
        <>
            {opened &&
            <Backdrop>
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
                    <CloseButton/>
                    <MinimizeButton/>
                </Dialog>
            </Backdrop>
            }
        </>
    )
}

export default ResultDialog

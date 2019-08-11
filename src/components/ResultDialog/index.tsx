import React, {useContext, useEffect, useState} from 'react'
import {fold, getOrElse, isNone} from 'fp-ts/lib/Option'
import {pipe} from 'fp-ts/lib/pipeable'
import Loader from './Loader'
import AppContext from '../../AppContextProvider'
import {getRecommendations, RecommendationsResponse} from '../../api/recommendations'
import {defaultTrack, Track} from '../../shared'
import Backdrop from './Backdrop'
import CloseButton from './CloseButton'
import MinimizeButton from './MinimizeButton'
import {Content, Dialog, Error, Info, NoResult, RetryButton} from './ResultDialog.sc'
import AudioRowList from './AudioRowList'

const ResultDialog: React.FC = () => {
    const {maybeTrack, setTrack, loading, setLoading} = useContext(AppContext)

    const [error, setError] = useState(false)
    const [noResult, setNoResult] = useState(false)
    const [canFetchMore, setCanFetchMore] = useState(false)
    const [tracks, setTracks] = useState([] as Track[])
    const [fetchingDone, setFetchingDone] = useState(false)

    useEffect(() => {
        if (isNone(maybeTrack)) {
            return
        }

        setNoResult(false)
        setLoading(true)
        setCanFetchMore(false)
        setFetchingDone(false)

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
                setLoading(false)
                return
            }

            if (!recommendResponse.tracks.length) {
                setNoResult(true)
                setLoading(false)
                return
            }

            setTracks(recommendResponse.tracks)
            setCanFetchMore(recommendResponse.canFetchMoreTracks)
            setFetchingDone(true)
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
            <Backdrop>
                <Dialog tabIndex={0}>
                    <Content>
                        <Info>Похожие на <strong>{track.artist} &mdash; {track.title}</strong></Info>
                        {canFetchMore &&
                        <button className='flat_button button_wide secondary' onClick={retry}>Показать ещё</button>
                        }
                        {loading && <Loader/>}
                        {fetchingDone && <AudioRowList tracks={tracks}/>}
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
        </>
    )
}

export default ResultDialog

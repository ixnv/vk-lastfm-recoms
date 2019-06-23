import {Track} from '../types'

const apiRoot = process.env.RECOMMENDATIONS_API_ROOT

export type RecommendedTrack = {
    artist: string,
    track: string // FIXME: types on server and client are different
}

type RecommendationsResponse = {
    response: Array<RecommendedTrack>,
    error: boolean
}

export async function getRecommendations({title, artist}: Track): Promise<RecommendationsResponse> {
    return await fetch(`${apiRoot}/similar-tracks?artist=${artist}&track=${title}`)
        .then(response => {
            if (response.status !== 200) {
                throw response
            }

            try {
                return response.json()
            } catch (e) {
                // could not parse
                throw e
            }
        })
        .then(response => ({
            error: false,
            response
        }))
        .catch(response => {
            return {
                error: true,
                response
            }
        })
}

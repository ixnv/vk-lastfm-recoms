import {Track} from '../shared'

const apiRoot = process.env.RECOMMENDATIONS_API_ROOT
const apiVersion = process.env.RECOMMENDATIONS_API_VERSION

export type RecommendationsResponse = {
    tracks: Track[]
    error: boolean,
    canFetchMoreTracks: boolean
}

export async function getRecommendations({title, artist}: Track): Promise<RecommendationsResponse> {
    return await fetch(`${apiRoot}/similar-tracks?version=${apiVersion}&artist=${artist}&track=${title}`)
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
        .then(body => ({
            error: false,
            ...body
        }))
        .catch(body => {
            return {
                error: true,
                ...body
            }
        })
}

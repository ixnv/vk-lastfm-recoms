import { Track } from '../shared'

const apiRoot = process.env.RECOMMENDATIONS_API_ROOT
const apiVersion = process.env.RECOMMENDATIONS_API_VERSION

export type RecommendationsResponse = {
  tracks: Track[]
  error: boolean,
  canFetchMoreTracks: boolean
}

export async function getRecommendations ({ title, artist }: Track): Promise<RecommendationsResponse> {
  const url = `${apiRoot}/similar-tracks?version=${apiVersion}&artist=${artist}&track=${title}`
  return await fetch(url)
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
    .catch(body => ({
      error: true,
      ...body
    }))
}

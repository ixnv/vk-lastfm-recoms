import {ApiClient} from "./client/api";
import {getTracksFromSimilarArtists} from "./client/hybrid";

async function getTracks(artist, track, unwanted) {
    const apiClient = new ApiClient(process.env.LAST_FM_API_TOKEN)

    const similarTracks = await apiClient.getSimilarTracks(artist, track)

    let tracksResponse = []

    if (!similarTracks.error && similarTracks.response.length) {
        tracksResponse = similarTracks.response
    } else {
        tracksResponse = await getTracksFromSimilarArtists(artist)
    }

    // filter from unwanted
    if (unwanted) {
        try {
            unwanted = JSON.parse(unwanted).map(unwanted => unwanted.toLowerCase())
            tracksResponse = tracksResponse.filter(track => unwanted.indexOf(track.artist.toLowerCase()) === -1)
        } catch (e) {
            // not valid json
        }
    }

    return {
        tracks: tracksResponse,
        canFetchMoreTracks: !!tracksResponse.length
    }
}

export default getTracks

import {ApiClient} from "./api";
import {HTMLClient} from "./html";
import {shuffle} from "../util";

/**
 * Combines API calls with HTML if there's no data from API
 * @param artist
 * @returns {Promise<Array|*[]>}
 */
export const getTracksFromSimilarArtists = async (artist) => {
    const apiClient = new ApiClient(process.env.LAST_FM_API_TOKEN)

    let similarArtists = await apiClient.getSimilarArtists(artist)

    if (similarArtists.error || !similarArtists.response.length) {
        // artist not found
        if (similarArtists.response.error === ApiClient.ERROR_INVALID_PARAM) {
            return []
        }

        /**
         * sometimes lastfm api does not return similar artists,
         * even though they are displayed on the web page of artist
         * let's grab html
         */
        const htmlClient = new HTMLClient()
        similarArtists = await htmlClient.getSimilarArtists(artist)

        // if there are no similar artists even from html response then fetch top tracks for artist
        if (similarArtists.error) {
            const topTracks = await apiClient.getTopTracks(artist)
            return topTracks.error ? [] : topTracks.response
        }
    }

    let tracks = []

    // if there's not so many similar artists, return artist as well
    if (similarArtists.response.length <= 3) {
        const topTracks = await apiClient.getTopTracks(artist)
        tracks = topTracks.error ? [] : topTracks.response
    }

    const randomArtists = shuffle(similarArtists.response.slice(0, 40))
    const randomTopTracks = await apiClient.getRandomTopTracks(randomArtists, 4)

    tracks.unshift.apply(tracks, randomTopTracks)

    // filter null tracks
    return tracks.filter(track => track)
}

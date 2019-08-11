import {ApiClient} from "./client/api";
import {shuffle} from "./util";
import {HTMLClient} from "./client/html";

const apiClient = new ApiClient(process.env.LAST_FM_API_TOKEN)

const getTracksFromSimilarArtists = async (artist) => {
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

async function getTracks(artist, track, unwanted) {
    if (unwanted) {
        try {
            unwanted = JSON.parse(unwanted).map(unwanted => unwanted.toLowerCase())
        } catch (e) {
            unwanted = ''
        }
    }

    const similarTracks = await apiClient.getSimilarTracks(artist, track)
    let canFetchMoreTracks = false

    let statusCode = 200
    let tracksResponse = []

    if (!similarTracks.error && similarTracks.response.length) {
        tracksResponse = similarTracks.response
    }

    if (similarTracks.error || !similarTracks.response.length) {
        tracksResponse = await getTracksFromSimilarArtists(artist)
        canFetchMoreTracks = !!tracksResponse.length
    }

    // filter from unwanted
    if (statusCode === 200 && unwanted) {
        tracksResponse = tracksResponse.filter(track => unwanted.indexOf(track.artist.toLowerCase()) === -1)
    }

    return {
        tracks: tracksResponse,
        canFetchMoreTracks,
        statusCode
    }
}

module.exports = getTracks

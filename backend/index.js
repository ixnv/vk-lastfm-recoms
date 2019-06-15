import {shuffle} from "./util";
import {ApiClient, ERROR_INVALID_PARAM} from "./client/api";
import {HTMLClient} from "./client/html";

function parseQueryStringParameters(queryStringParameters) {
    let {
        artist,
        track,
        unwanted
    } = queryStringParameters

    if (unwanted) {
        try {
            unwanted = JSON.parse(unwanted).map(unwanted => unwanted.toLowerCase())
        } catch (e) {
            unwanted = ''
        }
    }

    return {
        artist,
        track,
        unwanted
    }
}

exports.handler = async (event, context, callback) => {
    if (event.httpMethod !== 'GET') {
        return callback(null, {
            statusCode: 405,
            body: JSON.stringify({'error': 'not allowed'}),
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    const {artist, track, unwanted} = parseQueryStringParameters(event.queryStringParameters)

    const apiClient = new ApiClient(process.env.LAST_FM_API_TOKEN)
    const similarTracks = await apiClient.getSimilarTracks(artist, track)

    let statusCode = 200
    let response = []

    if (!similarTracks.error && similarTracks.response.length) {
        response = similarTracks.response
    }

    if (similarTracks.error || !similarTracks.response.length) {
        const getTracksFromSimilarArtists = async () => {
            let similarArtists = await apiClient.getSimilarArtists(artist)

            if (similarArtists.error || !similarArtists.response.length) {
                // artist not found
                if (similarArtists.response.error === ERROR_INVALID_PARAM) {
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

        response = await getTracksFromSimilarArtists()
    }

    // filter from unwanted
    if (statusCode === 200 && unwanted) {
        response = response.filter(track =>
            track.artist
                .split(' ')
                .map(featuredArtist => unwanted.indexOf(featuredArtist.toLowerCase()) === -1)
                .reduce((x, acc) => acc &= x)
        )
    }

    callback(null, {
        statusCode: statusCode,
        body: JSON.stringify(response),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
}

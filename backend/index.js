const fetch = require('node-fetch')
const JSDOM = require('jsdom').JSDOM

class LastFMHTMLClient {
    constructor() {
        this.urlRoot = `${process.env.LAST_FM_WEBSITE}/music`
    }

    async getSimilarArtists(artist) {
        return await fetch(`${this.urlRoot}/${encodeURIComponent(artist)}/+similar`)
            .then(async (response) => {
                const html = await response.text()
                const dom = new JSDOM(html)
                const nodes = Array.from(dom.window.document.querySelectorAll('.big-artist-list-title'))

                return {
                    error: false,
                    response: nodes.map(node => {
                        return node.textContent
                    })
                }
            })
            .catch(error => {
                return {
                    error: true,
                    response: error
                }
            })
    }
}

class LastFMClient {
    constructor(token) {
        this.token = token
        this.apiRoot = process.env.LAST_FM_API_ROOT

        this.ERROR_INVALID_PARAM = 6 // artist or track not found
    }

    /**
     * @param method string
     * @param params object
     * @returns {string}
     */
    createUrl(method, params) {
        Object.keys(params).map(function (key) {
            params[key] = encodeURIComponent(params[key])
        })

        const signedParams = Object.assign({
            'api_key': this.token,
            'method': method,
            'autocorect': 1,
            'format': 'json'
        }, params)

        const queryString = Object.keys(signedParams).reduce((acc, k) => {
            acc.push(`${k}=${signedParams[k]}`)
            return acc
        }, []).join('&')

        return `${this.apiRoot}?${queryString}`
    }

    async request(resource, params) {
        const url = this.createUrl(resource, params)

        return await fetch(url)
            .then(response => {
                if (response.status !== 200) {
                    throw response
                }

                try {
                    return response.json()
                } catch (e) {
                    throw response
                }
            })
            .then(response => {
                if (response.hasOwnProperty('error')) {
                    throw response
                }

                return {
                    error: false,
                    response
                }
            })
            .catch(response => ({
                error: true,
                response
            }))
    }

    flatMap(payload, fn) {
        if (payload.error) {
            return payload
        }

        return {
            error: payload.error,
            response: fn(payload.response)
        }
    }

    async getSimilarTracks(artist, track) {
        const similarTracks = await this.request('track.getsimilar', {
            artist,
            track
        })

        return this.flatMap(similarTracks, (similarTracks) => {
            return similarTracks.track.map(({name, artist}) => {
                return {
                    artist: artist.name,
                    track: name
                }
            })
        })
    }

    async getSimilarArtists(artist) {
        const similarArtists = await this.request('artist.getsimilar', {
            artist
        })

        return this.flatMap(similarArtists, (similarArtists) => {
            return similarArtists.artist.map(({name}) => name)
        })
    }

    async getTopTracks(artist) {
        const topTracks = await this.request('artist.gettoptracks', {
            artist
        })

        return this.flatMap(topTracks, (topTracks) => {
            return topTracks.track.map(({name, artist}) => ({
                    artist: artist.name,
                    track: name
                })
            )
        })
    }

    async getRandomTopTracks(artists, chooseFrom) {
        return Promise.all(
            artists.map(async artist => {
                const topTracks = await this.getTopTracks(artist)
                // timeout or anything like that
                if (topTracks.error) {
                    return null
                }

                const top = topTracks.response.slice(0, chooseFrom).map(({name, artist}) => ({
                    artist: artist.name,
                    track: name
                }))

                if (!top.length) {
                    return null
                }

                return shuffle(top)[0]
            })
        )
    }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
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

    let {
        artist,
        track,
        unwanted
    } = event.queryStringParameters

    if (unwanted) {
        try {
            unwanted = JSON.parse(unwanted).map(unwanted => unwanted.toLowerCase())
        } catch (e) {
            unwanted = ''
        }
    }

    const apiClient = new LastFMClient(process.env.LAST_FM_API_TOKEN)
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
                if (similarArtists.response.error === apiClient.ERROR_INVALID_PARAM) {
                    return []
                }

                /**
                 * sometimes lastfm api does not return similar artists,
                 * even though they are displayed on the web page of artist
                 * let's grab html
                 */
                const htmlClient = new LastFMHTMLClient()
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

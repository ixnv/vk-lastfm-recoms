const fetch = require('node-fetch')
const JSDOM = require('jsdom').JSDOM

const getContent = async (url) => {
    return new Promise((resolve, reject) => {
        const request = require('https').get(url, (response) => {
            const body = [];

            response.on('data', (chunk) => body.push(chunk))

            response.on('end', () => resolve(body.join('')))
        })

        request.on('error', (err) => reject(err))
    })
}

class LastFMHTMLClient {
    constructor() {
        this.urlRoot = 'https://www.last.fm/music'
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
        this.apiRoot = 'https://ws.audioscrobbler.com/2.0/'

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

    async getSimilarTracks(artist, track) {
        const url = this.createUrl('track.getsimilar', {
            artist,
            track
        })

        const response = await getContent(url)
            .then(response => JSON.parse(response))
            .catch(response => response)

        if (response.hasOwnProperty('error')) {
            return {
                error: true,
                response: response
            }
        }

        return {
            error: false,
            response: response.similartracks.track.map(({name, artist}) => {
                return {
                    artist: artist.name,
                    track: name
                }
            })
        }
    }

    async getSimilarArtists(artist) {
        const url = this.createUrl('artist.getsimilar', {
            artist
        })

        const response = await getContent(url)
            .then(response => JSON.parse(response))

        if (response.hasOwnProperty('error')) {
            return {
                error: true,
                response
            }
        }

        return {
            error: false,
            response: response.similarartists.artist.map(({name}) => name)
        }
    }

    async getTopTracks(artist) {
        const url = this.createUrl('artist.gettoptracks', {
            artist
        })

        return await getContent(url)
            .catch(response => {
                return {
                    error: true,
                    response: JSON.parse(response)
                }
            })
            .then(response => {
                    if (response.hasOwnProperty('error')) {
                        return {
                            error: true,
                            response
                        }
                    }

                    return {
                        error: false,
                        response: JSON.parse(response).toptracks.track.map(({name, artist}) => {
                            return {
                                artist: artist.name,
                                track: name
                            }
                        })
                    }
                }
            )
    }

    async getRandomTopTracks(artists, chooseFrom) {
        return Promise.all(
            artists.map(async artist => {
                const url = this.createUrl('artist.gettoptracks', {
                    artist
                })
                const topTracks = await getContent(url)
                    .catch(response => {
                        return {
                            error: true,
                            response: JSON.parse(response)
                        }
                    })
                    .then(response => {
                            return {
                                error: false,
                                response: JSON.parse(response).toptracks.track
                            }
                        }
                    )

                // timeout or anything like that
                if (topTracks.error) {
                    return null
                }

                const top = topTracks.response.slice(0, chooseFrom).map(({name, artist}) => {
                    return {
                        artist: artist.name,
                        track: name
                    }
                })

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
                'Content-Type': 'application/json',
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

    const apiClient = new LastFMClient('74c6ff6a9c1edd5572557e2d63eb1bc3')
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

            if (similarArtists.response.length <= 3) {
                similarArtists.response.unshift(artist)
            }

            const randomArtists = shuffle(similarArtists.response.slice(0, 30))
            let tracks = await apiClient.getRandomTopTracks(randomArtists, 4)
            // filter null tracks
            return tracks.filter(track => track)
        }

        response = await getTracksFromSimilarArtists()
    }

    // filter from unwanted
    if (statusCode === 200 && unwanted) {
        response = response.filter(track => unwanted.indexOf(track.artist.toLowerCase()) === -1)
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

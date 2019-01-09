const fetch = require('node-fetch')
const jsdom = require('jsdom')
const { JSDOM } = jsdom;


const getContent = async (url) => {
    return new Promise((resolve, reject) => {
        const request = require('https').get(url, (response) => {
            console.log(response.statusCode)

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

                return nodes.map(node => {
                    return node.textContent
                })
            })
            .catch(error => {
                console.log('html fetch error', error)
                return []
            })
    }
}

class LastFMClient {
    constructor(token) {
        this.token = token
        this.apiRoot = 'https://ws.audioscrobbler.com/2.0/'
    }

    createUrl(method, params) {
        const signedParams = Object.assign({
            'token': this.token,
            'method': method,
            'autocorect': 1
        }, params)

        const queryString = Object.keys(signedParams).reduce((acc, k) => {
            acc.push(`${k}=${obj[k]}`)
            return acc
        }, []).join('&')

        return `${this.apiRoot}?${queryString}`
    }

    async getSimilarTracks(artist, track) {
        const response = await getContent(`${this.apiRoot}?method=track.getsimilar&autocorrect=1&artist=${artist}&track=${track}&api_key=${this.token}&format=json`)
            .then(response => JSON.parse(response))
            .catch(response => response)

        const isError = response.hasOwnProperty('error')

        if (isError) {
            return []
        }

        return response.similartracks.track.map(({ name, artist }) => {
            return {
                artist: artist.name,
                track: name
            }
        })
    }

    async getSimilarArtists(artist) {
        const response = await getContent(`${this.apiRoot}?method=artist.getsimilar&autocorrect=1&artist=${artist}&api_key=${this.token}&format=json`)
            .then(response => JSON.parse(response))

        const isError = response.hasOwnProperty('error')

        if (isError) {
            return []
        }

        return response.similarartists.artist.map(({ name, image }) => name)
    }

    async getRandomTopTracks(artists, chooseFrom) {
        return Promise.all(
            artists.map(async artist => {
                const response = await getContent(`${this.apiRoot}?method=artist.gettoptracks&autocorrect=1&artist=${encodeURIComponent(artist)}&api_key=${this.token}&format=json`)
                    .catch(response => [])
                    .then(response => JSON.parse(response))

                const top = response.toptracks.track.slice(0, chooseFrom).map(({ name, artist }) => {
                    return {
                        artist: artist.name,
                        track: name
                    }
                })

                if (!top) {
                    return null
                }

                return shuffle(top)[0]
            })
        )
    }

    async getArtistInfo(artist) {
        return await getContent(`${this.apiRoot}?method=`)
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
            body: JSON.stringify({ 'error': 'not allowed' }),
            headers: {
                'Content-Type': 'application/json',
            }
        })
    }

    const client = new LastFMClient('74c6ff6a9c1edd5572557e2d63eb1bc3')

    let { artist, track, unwanted } = event.queryStringParameters
    artist = encodeURIComponent(artist)
    track = encodeURIComponent(track)

    if (unwanted) {
        try {
            unwanted = JSON.parse(unwanted).map(unwanted => unwanted.toLowerCase())
        } catch (e) {
            unwanted = ''
        }
    }

    const similarTracks = await client.getSimilarTracks(artist, track)
    let response = similarTracks

    if (!response.length) {
        let similarArtists = await client.getSimilarArtists(artist)

        // TODO: do not fetch anything if artist does not have tags

        /**
         * sometimes lastfm api does not return similar artists, 
         * even though they are displayed on the web page of artist
         * let's grab html
         */
        if (!similarArtists.length) {
            const htmlClient = new LastFMHTMLClient()
            similarArtists = await htmlClient.getSimilarArtists(artist)
        }

        const randomArtists = shuffle(similarArtists.slice(0, 30))
        const tracks = await client.getRandomTopTracks(randomArtists, 4)

        response = tracks.filter(track => track)
    }

    // filter from unwanted
    if (unwanted) {
        response = response.filter(track => unwanted.indexOf(track.artist.toLowerCase()) === -1)
    }

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
}
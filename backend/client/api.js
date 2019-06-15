import fetch from 'node-fetch'
import {objectToQueryString, shuffle} from "../util";

export const ERROR_INVALID_PARAM = 6

export class ApiClient {
    constructor(token, apiRoot) {
        this.token = token
        this.apiRoot = apiRoot
    }

    /**
     * @param method string
     * @param params object
     * @returns {string}
     */
    _createUrl(method, params) {
        Object.keys(params).map(function (key) {
            params[key] = encodeURIComponent(params[key])
        })

        const signedParams = Object.assign({
            'api_key': this.token,
            'method': method,
            'autocorrect': 1,
            'format': 'json'
        }, params)

        const queryString = objectToQueryString(signedParams)

        return `${this.apiRoot}?${queryString}`
    }

    /**
     * @param method string
     * @param params object
     * @returns {Promise<T | {response: any, error: boolean}>}
     * @private
     */
    async _request(method, params) {
        return await fetch(this._createUrl(method, params))
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

    /**
     * @param response object
     * @param fn function
     * @returns {{response: *, error: *}|{error}|*}
     * @private
     */
    _flatMap(response, fn) {
        if (response.error) {
            return response
        }

        return {
            error: response.error,
            response: fn(response.response)
        }
    }

    /**
     * @param artist
     * @param track
     * @returns {Promise<{response: *, error: *}|{error}|*>}
     */
    async getSimilarTracks(artist, track) {
        const similarTracks = await this._request('track.getsimilar', {
            artist,
            track
        })

        return this._flatMap(similarTracks, similarTracks => {
            return similarTracks.track.map(({name, artist}) => {
                return {
                    artist: artist.name,
                    track: name
                }
            })
        })
    }

    /**
     * @param artist
     * @returns {Promise<{response: *, error: *}|{error}|*>}
     */
    async getSimilarArtists(artist) {
        const similarArtists = await this._request('artist.getsimilar', {
            artist
        })

        return this._flatMap(similarArtists, (similarArtists) => {
            return similarArtists.artist.map(({name}) => name)
        })
    }

    /**
     * @param artist string
     * @returns {Promise<{response: *, error: *}|{error}|*>}
     */
    async getTopTracks(artist) {
        const topTracks = await this._request('artist.gettoptracks', {
            artist
        })

        return this._flatMap(topTracks, (topTracks) => {
            return topTracks.track.map(({name, artist}) => ({
                    artist: artist.name,
                    track: name
                })
            )
        })
    }

    /**
     * @param artists Array<string>
     * @param chooseFrom int
     * @returns {Promise<[any, any, any, any, any, any, any, any, any, any]>}
     */
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
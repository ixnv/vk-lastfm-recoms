import {JSDOM} from 'jsdom'

export class HTMLClient {
    constructor(apiRoot) {
        this.apiRoot = apiRoot
    }

    /**
     * @param artist string
     * @returns {Promise<T | {response: any, error: boolean}>}
     */
    async getSimilarArtists(artist) {
        return await fetch(`${this.apiRoot}/music/${encodeURIComponent(artist)}/+similar`)
            .then(async (response) => {
                const html = await response.text()
                const dom = new JSDOM(html)
                const nodes = Array.from(dom.window.document.querySelectorAll('.similar-artists-item-name > .link-block-target'))

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
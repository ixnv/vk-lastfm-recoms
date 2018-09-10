class LastFMClient {
    constructor(token) {
        this.token = token
    }

    async getSimilarArtists(artist) {
        const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${artist}&api_key=${this.token}&format=json`)
            .then(response => response.json())

        const isError = response.hasOwnProperty('error')

        if (isError) {
            return response
        }

        return response.similarartists.artist.map(({name, image}) => {
            let thumb = image.find(thumb => thumb.size === 'extralarge')['#text']
            const noThumb = 'https://vk.com/images/deactivated_200.png'

            if (!thumb) {
                thumb = noThumb
            }

            return new Artist(name, thumb)
        })
    }

    async getSimilarTracks() {
        // TODO: figure out how to parse audio tracks without vk api
    }
}

class Artist {
    constructor(name, thumbnail) {
        this.name = name
        this.thumbnail = thumbnail
        // for opening in new tab
        this.link = `https://vk.com/audio?performer=1&q=${encodeURIComponent(name)}`
    }
}

class Templates {
    constructor(namespace) {
        this.ns = namespace
    }

    artistList(list) {
        return list.map(artist => `
            <div class="${this.ns}-artist">
                <img class="${this.ns}-artist_image" src="${artist.thumbnail}">
                <a href="${artist.link}" class="${this.ns}-artist_title audio_pl_snippet__artist_link">${artist.name}</a>
            </div>
        `).join('')
    }

    loadMore(offset) {
        return `
            <button class="${this.ns}-load-more">
                Показать еще
            </button>
        `;
    }
}

var dom = {
    insertAfterElement(elem, refElem) {
        return refElem.parentNode.insertBefore(elem, refElem.nextSibling)
    },
    insertBeforeElement(elem, refElem) {
        return refElem.parentNode.insertBefore(elem, refElem)
    },
    $(selector) {
        return document.querySelector(selector)
    }
}


async function init() {
    const namespace = 'vkappext';

    const templates = new Templates(namespace)

    const trackButtons = dom.$('div.audio_row__info._audio_row__info > div._audio_row__actions.audio_row__actions')
    const searchInput = dom.$('div.ui_search_new.ui_search._audio_search.audio_search.ui_search_btn_large._wrap')
    const appWrapper = document.createElement('div')
    appWrapper.classList = `${namespace}-wrapper`

    // TODO: ask user for token
    const client = new LastFMClient('token')
    const similarArtists = await client.getSimilarArtists('the body')
    appWrapper.innerHTML = templates.artistList(similarArtists.slice(0, 5))

    dom.insertAfterElement(appWrapper, searchInput)

    console.log(trackButtons)

    new MutationObserver(mutations => {
        mutations.forEach(mutation => console.log('mutation', mutation)
    }).observer()

    mutationObserver
}

init()

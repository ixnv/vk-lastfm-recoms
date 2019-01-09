"use strict";

/** global chrome */

// for debug
// https://github.com/lateral/chrome-extension-blogpost/compare/master...paulirish:master
function injectStyles(url) {
    var elem = document.createElement('link');
    elem.rel = 'stylesheet';
    elem.setAttribute('href', url);
    document.body.appendChild(elem);
}

injectStyles(chrome.extension.getURL('app.css'))

class Vk {
    constructor() {
        this.userId = this.getUserId()
    }

    getUserId() {
        // lol. TODO: create temp <script> and grab vk.id property
        const audioPageLink = document.querySelector('#l_aud > a')
        if (!audioPageLink) {
            return null            
        }

        return audioPageLink.href.substring(21)
    }

    static isAudioPage() {
        return location.pathname.search('/audio') !== -1
    }

    async * searchAudioTracks(tracks) {
        if (!tracks) {
            return null
        }

        for (const track of tracks) {
            yield await fetch("https://vk.com/al_audio.php", {
                "credentials": "include",
                "referrer": `https://vk.com/audios${this.userId}`,
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": `act=section&al=1&claim=0&is_layer=0&owner_id=${this.userId}&q=${track.artist}%20${track.track}&section=search`,
                "method": "POST",
                "mode": "cors",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }).then(
                async stream => {
                    return stream.arrayBuffer().then((data) => {
                        return (new TextDecoder('windows-1251')).decode(data)
                    })
                }
            ).then(response => {
                // in the beginning of response body there is VK specific non-html junk, trim it
                const pos = response.search('<div')
                const result = response.substring(pos)

                const html = document.createElement('html')
                html.innerHTML = result
                // for now only one is enough
                const node = html.querySelector('.audio_row')
                if (node) {
                    return node
                }

                return null
            })
        }
    }
}

class Settings {
    static async getUnwantedArtists() {
        return await chrome.storage.sync.get(['unwantedArtists'], (value) => {
            if (Object.keys(value).length) {
                return value
            }

            return []
        })
    }
}

class RecommedationsApi {
    constructor() {
        this.apiRoot = 'https://hblah41x5a.execute-api.eu-central-1.amazonaws.com/api'
    }

    async getTracks(artist, track) {
        let url = `${this.apiRoot}/similar-tracks?artist=${(artist)}&track=${(track)}`

        const unwanted = await Settings.getUnwantedArtists()
        if (unwanted) {
            url += `&unwanted=${unwanted}`
        }

        return await fetch(url)
            .then(r => r.json())
            .then(response => response)
            .catch(r => [])
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

    wrapper(content) {
        return `
            <section class="_audio_page_titled_block">
                <h2>Похожие исполнители</h2>
                <div class="_audio_page_titled_playlists">
                    ${content}
                </div>
            </section>
        `;
    }

    artistList(list) {
        return list.map(artist => `
            <div class="${this.ns}-artist">
                <img class="${this.ns}-artist_image" src="${artist.thumbnail}" alt="${artist.name}">
                <a href="${artist.link}" class="${this.ns}-artist_title audio_pl_snippet__artist_link">${artist.name}</a>
            </div>
        `).join('')
    }

    loadMore(offset) {
        return `
            <button class="${this.ns}-load-more">
                Показать еще
            </button>
        `
    }

    renderResultDialog() {
        const dialog = document.createElement('dialog')
        dialog.id = `${this.ns}-result-dialog`
        document.body.appendChild(dialog)
        return dialog
    }

    resetResultDialog() {
        const dialog = document.body.querySelector(`#${this.ns}-result-dialog`)
        const loader = `<div class="${this.ns}-loader lds-ellipsis"><div></div><div></div><div></div><div></div></div>`

        if (dialog.open) {
            dialog.close()
        }

        dialog.innerHTML = loader
        dialog.showModal()
        return dialog
    }

    appendAudioRow(dialog, audioRow) {
        dialog.append(audioRow)
    }

    stopLoader() {
        const loader = document.querySelector(`.${this.ns}-loader`)
        loader.style.display = 'none'
    }
}

const dom = {
    insertAfterElement(elem, refElem) {
        return refElem.parentNode.insertBefore(elem, refElem.nextSibling)
    },
    insertBeforeElement(elem, refElem) {
        return refElem.parentNode.insertBefore(elem, refElem)
    }
}

async function init() {
    const templates = new Templates('vkappext')

    const dialog = templates.renderResultDialog()

    dialog.addEventListener('click', function (event) {
        const rect = dialog.getBoundingClientRect()
        const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height
            && rect.left <= event.clientX && event.clientX <= rect.left + rect.width)
        if (!isInDialog) {
            dialog.close()
        }
    })

    const btnClass = `${templates.ns}-btn-similar`

    const vkClient = new Vk()
    const recommedationsApi = new RecommedationsApi()

    // why mousedown? 'click' triggers audio playback, because .audio_row__actions gets deleted on click event
    document.addEventListener('click', async (e) => {
        const { target } = e

        if (!target.classList.contains(btnClass)) {
            return
        }

        e.cancelBubble = true
        e.preventDefault()
        e.stopImmediatePropagation()
        e.stopPropagation()


        templates.resetResultDialog()

        const { artist, track } = target.dataset

        const similarTracks = await recommedationsApi.getTracks(artist, track)
        const search = vkClient.searchAudioTracks(similarTracks)

        while (true) {
            const iter = await search.next()

            if (iter.done) {
                templates.stopLoader()
                break
            }

            const audioRow = iter.value

            if (audioRow) {
                templates.appendAudioRow(dialog, audioRow)
            }
        }

        return false
    })

    document.addEventListener('mouseover', ({ target }) => {
        const closest = target.closest('.audio_row')

        if (!closest) {
            return
        }


        setTimeout(() => {
            const actions = closest.querySelector('.audio_row__actions')

            if (!actions || actions.querySelector(`.${btnClass}`)) {
                return
            }
    
            const audioRow = actions.closest('.audio_row__inner');
    
            // encode it right away, because non-html symbols get weird when saved in data-*
            const artist = encodeURIComponent(audioRow.querySelector('.audio_row__performers > a').textContent)
            const track = encodeURIComponent(audioRow.querySelector('.audio_row__title_inner').textContent)
    
            const div = document.createElement('div')
            div.innerHTML = `<button data-artist="${artist}" data-track="${track}" class="${btnClass} audio_row__action"></button>`
            actions.appendChild(div.firstChild)
        }, 100)
    })
}

init()

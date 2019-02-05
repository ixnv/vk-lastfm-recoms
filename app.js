"use strict";

/** global chrome */

// for debugging css
// https://github.com/lateral/chrome-extension-blogpost/compare/master...paulirish:master
function injectStyles(url) {
    const elem = document.createElement('link');
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
        // lol
        const audioPageLink = document.querySelector('#l_aud > a')
        if (!audioPageLink) {
            return null
        }

        return audioPageLink.href.substring(21)
    }

    async* searchAudioTracks(tracks) {
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

                // TODO: filter by artist name
                const node = html.querySelector('.audio_row')
                if (node) {
                    return node
                }

                return null
            })
        }
    }

    // copied from vk sources
    cancelEvent(e) {
        if (!(e = e || window.event))
            return !1
        for (; e.originalEvent;)
            e = e.originalEvent
        return e.preventDefault && e.preventDefault(),
        e.stopPropagation && e.stopPropagation(),
        e.stopImmediatePropagation && e.stopImmediatePropagation(),
            e.cancelBubble = !0,
            e.returnValue = !1,
            !1
    }
}

class RecommedationsApi {
    constructor() {
        this.apiRoot = 'https://hblah41x5a.execute-api.eu-central-1.amazonaws.com/api'
    }

    async getTracks(artist, track) {
        return await fetch(`${this.apiRoot}/similar-tracks?artist=${(artist)}&track=${(track)}&unwanted=["Oxxxymiron"]`)
            .then(r => r.json())
            .then(response => response)
            .catch(r => [])
    }
}

// TODO: switch to react
class Templates {
    constructor(namespace) {
        this.ns = namespace
    }

    render() {
        const wrapper = document.createElement('div')
        document.body.appendChild(wrapper)

        const loader = `
            <div class="${this.ns}-loader lds-ellipsis">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        `

        wrapper.innerHTML = `
            <div class="${this.ns}-backdrop"></div>
            <div id="${this.ns}-result-dialog">
                <h3 class="${this.ns}-result-dialog__info">Похожие на <strong class="${this.ns}-track"></strong></h3>
                <div class="${this.ns}-result-dialog__more-btn" data-more="[]">
                    <a>Еще</a>
                </div>
                ${loader}
                <div class="${this.ns}-result-list"></div>
                <div class="${this.ns}-not-found">Ничего не найдено</div>
            </div>
         `

        document.querySelector(`.${this.ns}-backdrop`).addEventListener('click', (e) => {
            document.querySelector(`.${this.ns}-backdrop`).style.display = 'none'
            this.getDialogNode().style.display = 'none'
        }, true)
    }

    getDialogNode() {
        return document.querySelector(`#${this.ns}-result-dialog`)
    }

    openDialog(artist, track) {
        this.showBackground()

        const dialog = this.getDialogNode()

        if (dialog.style.display === 'block') {
            dialog.style.display = 'none'
        }

        this.hideNotFoundResult()
        this.clearResult()
        this.setResultInfo(artist, track)
        this.showLoader()

        dialog.dataset.artist = artist
        dialog.dataset.track = track
        dialog.style.display = 'block'
        return dialog
    }

    setResultInfo(artist, track) {
        document.querySelector(`.${this.ns}-track`).textContent = `${decodeURIComponent(artist)} - ${decodeURIComponent(track)}`
    }

    setMoreTracks(moreTracks) {
        const moreTracksButton = document.querySelector(`.${this.ns}-result-dialog__more-btn`)
        moreTracksButton.dataset.more = JSON.stringify(moreTracks)
    }

    clearResult() {
        this.hideNotFoundResult()
        document.body.querySelector(`.${this.ns}-result-list`).innerHTML = ''
    }

    appendAudioRow(dialog, audioRow) {
        document.body.querySelector(`.${this.ns}-result-list`).append(audioRow)
    }

    showLoader() {
        const loader = document.querySelector(`.${this.ns}-loader`)
        loader.style.display = 'block'
    }

    showBackground() {
        document.querySelector(`.${this.ns}-backdrop`).style.display = 'block'
    }

    hideLoader() {
        const loader = document.querySelector(`.${this.ns}-loader`)
        loader.style.display = 'none'
    }

    showNotFoundResult() {
        document.querySelector(`.${this.ns}-not-found`).style.display = 'block'
    }

    hideNotFoundResult() {
        document.querySelector(`.${this.ns}-not-found`).style.display = 'none'
    }
}

const PAGE_SIZE = 10

async function init() {
    const vkClient = new Vk()
    const recommedationsApi = new RecommedationsApi()
    const templates = new Templates('vkappext')

    templates.render()

    const dialog = templates.getDialogNode()

    const searchVkTracks = async (tracks) => {
        const search = vkClient.searchAudioTracks(tracks)

        let foundAny = false

        while (true) {
            const iter = await search.next()

            if (iter.done) {
                templates.hideLoader()
                break
            }

            const audioRow = iter.value

            if (audioRow) {
                foundAny = true
                templates.appendAudioRow(dialog, audioRow)
            }
        }

        if (!foundAny) {
            templates.showNotFoundResult(dialog)
        }
    }

    const findTracks = async (artist, track) => {
        const similarTracks = await recommedationsApi.getTracks(artist, track)

        const tracksForOnePage = similarTracks.slice(0, PAGE_SIZE)
        const moreTracks = similarTracks.slice(PAGE_SIZE)

        if (moreTracks) {
            templates.setMoreTracks(moreTracks)
        }

        await searchVkTracks(tracksForOnePage)
    }

    const btnClass = `${templates.ns}-similar-btn`

    document.addEventListener('mouseover', ({target}) => {
        const closest = target.closest('.audio_row')

        if (!closest) {
            return
        }

        setTimeout(() => {
            const actions = closest.querySelector('.audio_row__actions')

            if (!actions || actions.querySelector(`.${btnClass}`)) {
                return
            }

            const audioRow = actions.closest('.audio_row__inner')

            // encode it right away, because non-html symbols get weird when saved in data-*
            const artist = encodeURIComponent(audioRow.querySelector('.audio_row__performers > a').textContent)
            const track = encodeURIComponent(audioRow.querySelector('.audio_row__title_inner').textContent)
            const buttonId = `${templates.ns}-find-similar`
            const div = document.createElement('div')
            div.innerHTML = `<a id="${buttonId}" data-artist="${artist}" data-track="${track}" class="${btnClass} audio_row__action"></a>`
            actions.appendChild(div.firstChild)
            document.querySelector(`#${buttonId}`).addEventListener('click', async (event) => {
                vkClient.cancelEvent(event)

                const {target} = event
                const {artist, track} = target.dataset
                templates.openDialog(artist, track)
                await findTracks(artist, track)
            })
        }, 100)
    })

    document.body.querySelector(`.${templates.ns}-result-dialog__more-btn`).addEventListener('click', async (e) => {
        templates.showLoader()
        templates.clearResult()

        const more = JSON.parse(e.target.closest('div').dataset.more)

        if (!more.length) {
            const {artist, track} = dialog.dataset
            templates.setResultInfo(artist, track)
            await findTracks(artist, track)

            return false
        }

        templates.setMoreTracks(more.slice(PAGE_SIZE))
        await searchVkTracks(more.slice(0, PAGE_SIZE))
    })
}

init()

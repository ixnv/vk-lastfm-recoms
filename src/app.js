'use strict'

/** global chrome */

// for debugging css
// https://github.com/lateral/chrome-extension-blogpost/compare/master...paulirish:master
function injectStyles(url) {
    const elem = document.createElement('link')
    elem.rel = 'stylesheet'
    elem.setAttribute('href', url)
    document.body.appendChild(elem)
}

injectStyles(chrome.extension.getURL('app.css'))

// https://github.com/gustf/js-levenshtein
const levenshtein = (function () {
    function _min(d0, d1, d2, bx, ay) {
        return d0 < d1 || d2 < d1
            ? d0 > d2
                ? d2 + 1
                : d0 + 1
            : bx === ay
                ? d1
                : d1 + 1
    }

    return function (a, b) {
        if (a === b) {
            return 0
        }

        if (a.length > b.length) {
            var tmp = a
            a = b
            b = tmp
        }

        var la = a.length
        var lb = b.length

        while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
            la--
            lb--
        }

        var offset = 0

        while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
            offset++
        }

        la -= offset
        lb -= offset

        if (la === 0 || lb < 3) {
            return lb
        }

        var x = 0
        var y
        var d0
        var d1
        var d2
        var d3
        var dd
        var dy
        var ay
        var bx0
        var bx1
        var bx2
        var bx3

        var vector = []

        for (y = 0; y < la; y++) {
            vector.push(y + 1)
            vector.push(a.charCodeAt(offset + y))
        }

        var len = vector.length - 1

        for (; x < lb - 3;) {
            bx0 = b.charCodeAt(offset + (d0 = x))
            bx1 = b.charCodeAt(offset + (d1 = x + 1))
            bx2 = b.charCodeAt(offset + (d2 = x + 2))
            bx3 = b.charCodeAt(offset + (d3 = x + 3))
            dd = (x += 4)
            for (y = 0; y < len; y += 2) {
                dy = vector[y]
                ay = vector[y + 1]
                d0 = _min(dy, d0, d1, bx0, ay)
                d1 = _min(d0, d1, d2, bx1, ay)
                d2 = _min(d1, d2, d3, bx2, ay)
                dd = _min(d2, d3, dd, bx3, ay)
                vector[y] = dd
                d3 = d2
                d2 = d1
                d1 = d0
                d0 = dy
            }
        }

        for (; x < lb;) {
            bx0 = b.charCodeAt(offset + (d0 = x))
            dd = ++x
            for (y = 0; y < len; y += 2) {
                dy = vector[y]
                vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1])
                d0 = dy
            }
        }

        return dd
    }
})()

const state = {
    ui: {
        isMinResultOpened: false,
        isResultDialogOpened: false
    },
    moreTracks: [],
    tracks: []
}

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
            yield await fetch('https://vk.com/al_audio.php', {
                'credentials': 'include',
                'referrer': `https://vk.com/audios${this.userId}`,
                'referrerPolicy': 'no-referrer-when-downgrade',
                'body': `act=section&al=1&claim=0&is_layer=0&owner_id=${this.userId}&q=${track.artist}%20${track.track}&section=search`,
                'method': 'POST',
                'mode': 'cors',
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(
                // decode to utf-8
                async body => body.arrayBuffer().then(data => (new TextDecoder('windows-1251')).decode(data))
            ).then(response => {
                // in the beginning of response body there is VK specific non-html junk, trim it
                const html = document.createElement('html')
                html.innerHTML = response.substring(response.search('<div'))

                const audioRows = html.querySelectorAll('.audio_row')

                const distances = {}

                // filter by artist name, bc VK searches by entry not linearly
                for (const audioRow of audioRows) {
                    const audioRowInfo = audioRow.children[0].children[6].children[0]
                    const performer = audioRowInfo.children[0].textContent.trim().toLowerCase()
                    const search = track.artist.toLowerCase()

                    /**
                     * use levenshtein distance for filtering artists
                     * because sometimes VK gives you completely non-related tracks in search results
                     * ex. search for "Skin Area - In the Skin" first result would be "Linkin Park & Eminem - Skin to Bone"
                     */
                    const distance = levenshtein(search, performer)
                    if (!distances.hasOwnProperty(distance)) {
                        distances[distance] = audioRow

                        if (distance === 0) {
                            break
                        }
                    }
                }

                const minDistance = Math.min(...Object.keys(distances).map(x => +x))
                // Math.min returns Infinity on []
                if (minDistance !== Infinity && minDistance < track.artist.length) {
                    return distances[minDistance]
                }

                return null
            })
        }
    }

    // copied from vk sources
    cancelEvent(e) {
        if (!(e = e || window.event))
            return false

        for (; e.originalEvent;)
            e = e.originalEvent

        return e.preventDefault && e.preventDefault(),
        e.stopPropagation && e.stopPropagation(),
        e.stopImmediatePropagation && e.stopImmediatePropagation(),
            e.cancelBubble = true,
            e.returnValue = false,
            false
    }
}

class RecommedationsApi {
    constructor() {
        this.apiRoot = 'https://hblah41x5a.execute-api.eu-central-1.amazonaws.com/api'
    }

    async getTracks(artist, track) {
        return await fetch(`${this.apiRoot}/similar-tracks?artist=${artist}&track=${track}&unwanted=["Oxxxymiron"]`)
            .then(response => {
                if (response.status !== 200) {
                    throw response
                }

                try {
                    return response.json()
                } catch (e) {
                    // could not parse
                    throw e
                }
            })
            .then(response => ({
                error: false,
                response
            }))
            .catch(response => {
                console.error(response)
                return {
                    error: true,
                    response
                }
            })
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
            <div class="${this.ns}-loader">
                <div class="lds-ellipsis">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>                
                </div>
            </div>
        `

        wrapper.innerHTML = `
            <div class="${this.ns}-result-min">
                <div style="float: right;margin: 5px 7px 0 0;">
                    <div class="${this.ns}-result-min__actions ${this.ns}-result-min__maximize">
                        <svg class="videoplayer_btn_icon videoplayer_expand_icon" viewBox="729 480 16 16" xmlns="http://www.w3.org/2000/svg" focusable="false">
                            <path d="M729 481.994c0-1.1.895-1.994 1.994-1.994h12.012c1.1 0 1.994.895 1.994 1.994v12.012c0 1.1-.895 1.994-1.994 1.994h-12.012c-1.1 0-1.994-.895-1.994-1.994v-12.012zm2 4.004c0-.55.456-.998 1.002-.998h9.996c.553 0 1.002.446 1.002.998v7.004c0 .55-.456.998-1.002.998h-9.996c-.553 0-1.002-.446-1.002-.998v-7.004z" fill="#9aa1ad" fill-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="${this.ns}-result-min__actions ${this.ns}-result-min__close ${this.ns}-closable"></div>
                </div>
                <div class="clearfix"></div>
                <div class="${this.ns}-result-min__info">
                    Похожие на <strong class="${this.ns}-track"></strong>
                </div>
            </div>

            <div class="${this.ns}-backdrop ${this.ns}-closable"></div>

            <div id="${this.ns}-result-dialog" tabindex="0">
                <div class="${this.ns}-result-dialog__content">
                    <h3 class="${this.ns}-result-dialog__info">Похожие на <strong class="${this.ns}-track"></strong></h3>
                    <button class="flat_button button_wide secondary ${this.ns}-result-dialog__more-btn" data-more="[]">
                        Показать ещё
                    </button>
                    ${loader}
                    <div class="${this.ns}-result-list"></div>
                    <div class="${this.ns}-not-found">Похожих аудиозаписей не найдено</div>
                    <div class="${this.ns}-error">
                        <div>Произошла ошибка</div>
                        <button class="flat_button ${this.ns}-error__try-btn">Попробовать заново</button>
                    </div>
                </div>
                <div class="${this.ns}-result-dialog__actions ${this.ns}-close-btn ${this.ns}-closable"></div>
                <div class="${this.ns}-result-dialog__actions ${this.ns}-minimize-btn"></div>
            </div>
         `

        document.querySelectorAll(`.${this.ns}-closable`).forEach(node => node.addEventListener('click', () => {
            this.hideError()
            this.hideBackdrop()
            this.clearResult()

            this.hideMinResult()
            this.hideDialogResult()
            this.unsetMoreTracks()
        }))

        document.querySelector(`.${this.ns}-minimize-btn`).addEventListener('click', () => {
            this.showMinResult()
            this.hideBackdrop()
            this.hideDialogResult()
        })

        document.querySelector(`.${this.ns}-result-min__maximize`).addEventListener('click', () => {
            this.hideMinResult()
            this.hideMinResult()
            this.showBackdrop()
            this.showDialogResult()
        })
    }

    getDialogNode() {
        return document.querySelector(`#${this.ns}-result-dialog`)
    }

    isDialogVisible() {
        return this.getDialogNode().style.display === 'block'
    }

    openDialog(artist, track) {
        this.showBackdrop()

        const dialog = this.getDialogNode()

        if (dialog.style.display === 'block') {
            this.hide(dialog)
        }

        this.hideNotFoundResult()
        this.clearResult()
        this.setResultInfo(artist, track)
        this.hideMoreButton()
        this.showLoader()

        dialog.dataset.artist = artist
        dialog.dataset.track = track
        dialog.style.display = 'block'
        return dialog
    }

    setResultInfo(artist, track) {
        document.querySelectorAll(`.${this.ns}-track`).forEach(
            node => node.textContent = `${decodeURIComponent(artist)} - ${decodeURIComponent(track)}`
        )
    }

    setMoreTracks(moreTracks) {
        const moreTracksButton = document.querySelector(`.${this.ns}-result-dialog__more-btn`)
        moreTracksButton.dataset.more = JSON.stringify(moreTracks)
    }

    unsetMoreTracks() {
        const moreTracksButton = document.querySelector(`.${this.ns}-result-dialog__more-btn`)
        moreTracksButton.dataset.more = JSON.stringify([])
    }

    clearResult() {
        this.hideNotFoundResult()
        document.body.querySelector(`.${this.ns}-result-list`).innerHTML = ''
    }

    appendAudioRow(dialog, audioRow) {
        document.body.querySelector(`.${this.ns}-result-list`).append(audioRow)
    }

    showLoader() {
        this.show(document.querySelector(`.${this.ns}-loader`))
    }

    hideLoader() {
        this.hide(document.querySelector(`.${this.ns}-loader`))
    }

    showMoreButton() {
        this.show(document.querySelector(`.${this.ns}-result-dialog__more-btn`))
    }

    hideMoreButton() {
        this.hide(document.querySelector(`.${this.ns}-result-dialog__more-btn`))
    }

    showBackdrop() {
        this.show(document.querySelector(`.${this.ns}-backdrop`))
    }

    hideBackdrop() {
        this.hide(document.querySelector(`.${this.ns}-backdrop`))
    }

    showNotFoundResult() {
        this.show(document.querySelector(`.${this.ns}-not-found`))
    }

    hideNotFoundResult() {
        this.hide(document.querySelector(`.${this.ns}-not-found`))
    }

    getResultMinNode() {
        return document.querySelector(`.${this.ns}-result-min`)
    }

    isResultMinVisible() {
        return this.getResultMinNode().style.display === 'block'
    }

    showMinResult() {
        this.show(document.querySelector(`.${this.ns}-result-min`))
    }

    hideMinResult() {
        this.hide(document.querySelector(`.${this.ns}-result-min`))
    }

    hideDialogResult() {
        this.hide(this.getDialogNode())
    }

    showDialogResult() {
        this.show(this.getDialogNode())
    }

    showError(artist, track) {
        const tryAgainButton = document.querySelector(`.${this.ns}-error button`)
        tryAgainButton.dataset.artist = artist
        tryAgainButton.dataset.track = track

        this.show(document.querySelector(`.${this.ns}-error`))
    }

    hideError() {
        this.hide(document.querySelector(`.${this.ns}-error`))
    }

    hide(element) {
        element.style.display = 'none'
    }

    show(element) {
        element.style.display = 'block'
    }
}

const PAGE_SIZE = 10

async function init() {
    const vkClient = new Vk()
    const recommedationsApi = new RecommedationsApi()
    const templates = new Templates('vkappext')

    // avoid render on any non-UI pages (.png, .jpg, etc)
    if (vkClient.getUserId() === null) {
        return false
    }

    templates.render()

    const dialog = templates.getDialogNode()

    const searchVkTracks = async (tracks) => {
        const search = vkClient.searchAudioTracks(tracks)

        let foundAny = false
        let foundCount = 0

        while (true) {
            const iter = await search.next()

            if (iter.done || (!templates.isDialogVisible() && !templates.isResultMinVisible())) {
                templates.hideLoader()
                break
            }

            const audioRow = iter.value

            if (audioRow) {
                foundAny = true
                foundCount++
                templates.appendAudioRow(dialog, audioRow)
            }
        }

        if (foundCount <= PAGE_SIZE) {
            // TODO: fetch other page
            templates.getDialogNode()
        }

        if (!foundAny) {
            templates.hideMoreButton()
            templates.showNotFoundResult(dialog)
        } else {
            templates.showMoreButton()
        }
    }

    const findTracks = async (artist, track) => {
        const similarTracksResponse = await recommedationsApi.getTracks(artist, track)

        if (similarTracksResponse.error) {
            templates.hideLoader()
            templates.showError(artist, track)
            return
        }

        const similarTracks = similarTracksResponse.response
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
            div.innerHTML = `<a id="${buttonId}" data-artist="${artist}" data-track="${track}" class="${btnClass} audio_row__action" title="Показать похожие из Last FM"></a>`
            actions.appendChild(div.firstChild)

            // attach event listener right here, bc element gets deleted after mouseout
            document.querySelector(`#${buttonId}`).addEventListener('click', async (event) => {
                vkClient.cancelEvent(event)

                const {target} = event
                const {artist, track} = target.dataset

                templates.hideMinResult()
                templates.openDialog(artist, track)
                await findTracks(artist, track)
            })
        }, 10)
    })

    document.querySelector(`.${templates.ns}-result-dialog__more-btn`).addEventListener('click', async (e) => {
        templates.showLoader()
        templates.hideMoreButton()
        templates.clearResult()

        const more = JSON.parse(e.target.dataset.more)

        if (!more.length) {
            const {artist, track} = dialog.dataset
            templates.setResultInfo(artist, track)
            await findTracks(artist, track)

            return false
        }

        templates.setMoreTracks(more.slice(PAGE_SIZE))
        await searchVkTracks(more.slice(0, PAGE_SIZE))
    })

    document.querySelector(`.${templates.ns}-error__try-btn`).addEventListener('click', async (event) => {
        templates.hideError()

        const {target} = event
        const {artist, track} = target.dataset

        templates.hideMinResult()
        templates.openDialog(artist, track)
        await findTracks(artist, track)
    })

    // vk intercepts keypress and keydown (?) use keyup instead
    window.addEventListener('keyup', ({key}) => {
        if (key === 'Escape' && templates.isDialogVisible()) {
            templates.hideError()
            templates.hideBackdrop()
            templates.clearResult()

            templates.hideMinResult()
            templates.hideDialogResult()
            templates.unsetMoreTracks()
        }
    })
}

init()

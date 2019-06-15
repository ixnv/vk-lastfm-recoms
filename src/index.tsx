import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {App} from './app'
import RecommendButton, {RecommendButtonClass} from './components/RecommendButton'
import {Track} from './types'

const wrapperClass = 'vk-lastfm-recommendations'

const wrapper = document.createElement('div')
wrapper.setAttribute('class', wrapperClass)
document.body.appendChild(wrapper)

document.addEventListener('mouseover', ({target}: MouseEvent) => {
    if (target === null) {
        return
    }

    // @ts-ignore
    const closest = target.closest('.audio_row')

    if (!closest) {
        return
    }

    setTimeout(() => {
        const actions = closest.querySelector('.audio_row__actions')

        if (!actions || actions.querySelector(`.${RecommendButtonClass}`)) {
            return
        }

        const audioRow = actions.closest('.audio_row__inner')

        const artist = audioRow.querySelector('.audio_row__performers > a').textContent
        const title = audioRow.querySelector('.audio_row__title_inner').textContent

        const track: Track = {
            artist,
            title
        }

        const div = document.createElement('div')
        const button = <RecommendButton parentEl={div} track={track}/>

        ReactDOM.render(button, div)
        const first = div.firstChild

        if (first) {
            // NOTE: vk and react are fucking with event propagation, use the dumbest way possible
            // @ts-ignore
            first.firstChild.setAttribute('onclick', 'cancelEvent(event)')
            actions.appendChild(first.firstChild)
        }
    }, 10)
}, false)

ReactDOM.render(
    <App/>,
    document.querySelector(`.${wrapperClass}`)
)
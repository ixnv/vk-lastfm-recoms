import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {App} from './app'
import RecommendButton, {RecommendButtonClass} from './components/RecommendButton'
import {Track} from './types'
import {AppContextProvider} from './AppContextProvider'

const wrapperClass = 'vk-lastfm-recommendations'

const wrapper = document.createElement('div')
wrapper.setAttribute('class', wrapperClass)
document.body.appendChild(wrapper)

ReactDOM.render(
    <App/>,
    document.querySelector(`.${wrapperClass}`)
)

document.addEventListener('mouseover', ({target}: MouseEvent) => {
    if (target === null) {
        return
    }

    // @ts-ignore
    const closest = target.closest('.audio_row')

    if (!closest) {
        return
    }

    // wait for .audio_row__actions to appear
    setTimeout(() => {
        const actions = closest.querySelector('.audio_row__actions')

        if (!actions || actions.querySelector(`.${RecommendButtonClass}`)) {
            return
        }

        const audioRow = actions.closest('.audio_row__inner')

        const artist = audioRow.querySelector('.audio_row__performers > a').textContent.trim()
        const title = audioRow.querySelector('.audio_row__title_inner').textContent.trim()

        const track: Track = {
            artist,
            title
        }

        const div = document.createElement('div')
        const button = (
            <AppContextProvider>
                <RecommendButton parentEl={div} track={track}/>
            </AppContextProvider>
        )

        ReactDOM.render(button, div)
        const first = div.firstChild

        if (first) {
            const wrappedButton = first.firstChild
            if (wrappedButton) {
                // @ts-ignore
                wrappedButton.setAttribute('onclick', 'cancelEvent(event)')
                actions.appendChild(first.firstChild)
            }
        }
    }, 10)
}, false)
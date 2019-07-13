import * as React from 'react'
import ResultDialog from './components/ResultDialog'
import ResultMinimized from './components/ResultMinimized'
import {AppContextProvider} from './AppContextProvider'
import RecommendButton, {RecommendButtonClass} from './components/RecommendButton'
import {Track} from './types'
import * as ReactDOM from 'react-dom'

const wrapperClass = 'vk-lastfm-recommendations'
const wrapper = document.createElement('div')
wrapper.setAttribute('class', wrapperClass)
document.body.appendChild(wrapper)

// @ts-ignore
let buttonRef

const App = (
    <AppContextProvider>
        <RecommendButton ref={node => buttonRef = node} parentEl={wrapper}/>
        <ResultDialog/>
        <ResultMinimized/>
    </AppContextProvider>
)

ReactDOM.render(App, wrapper)

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

        // @ts-ignore
        buttonRef.state.track = {
            artist,
            title
        } as Track
        // @ts-ignore
        const button = buttonRef.el
        // set it right here, vk fucks up event handling
        button!.setAttribute('onclick', 'cancelEvent(event)')
        actions.appendChild(button)
    }, 10)
}, false)
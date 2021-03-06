import React from 'react'
import ResultDialog from './components/ResultDialog/index'
import ResultMinimized from './components/ResultMinimized'
import { AppContextProvider } from './AppContextProvider'
import RecommendButton, { RecommendButtonClass } from './components/RecommendButton'
import * as ReactDOM from 'react-dom'
import * as Sentry from '@sentry/browser'
import { wrapperClass } from './shared'
import { runLogger } from './logger/dev'

Sentry.init({ dsn: 'https://c6cb0296247848808eb6d4d27077bf85@sentry.io/1764521' })

let buttonRef: RecommendButton | null

const wrapper = document.createElement('div')
wrapper.setAttribute('class', wrapperClass)
document.body.appendChild(wrapper)

ReactDOM.render(
  <AppContextProvider>
    <RecommendButton ref={node => buttonRef = node} parentEl={wrapper}/>
    <ResultDialog/>
    <ResultMinimized/>
  </AppContextProvider>,
  wrapper
)

document.addEventListener('mouseover', (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target) {
    return
  }

  const closest = target.closest('.audio_row')
  if (!closest) {
    return
  }

  // wait for .audio_row__actions to appear
  setTimeout(() => {
    const actions = closest.querySelector('.audio_row__actions')

    if (!actions) {
      return
    }
    const hasRecommendButton = actions.querySelector(`.${RecommendButtonClass}`)
    const audioRow = actions.closest('.audio_row__inner')
    if (hasRecommendButton || !audioRow) {
      return
    }

    const artist = audioRow.querySelector('.audio_row__performers > a')!.textContent!.trim()
    const title = audioRow.querySelector('.audio_row__title_inner')!.textContent!.trim()

    buttonRef!.state.track = {
      artist,
      title
    }
    // @ts-ignore
    const button = buttonRef!.el
    // set it right here, vk fucks up event handling
    button.setAttribute('onclick', 'cancelEvent(event)')
    button.style.display = 'inline'
    actions.appendChild(button)
  }, 10)
})

runLogger()

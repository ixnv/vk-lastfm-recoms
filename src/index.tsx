import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {App} from './app'

const wrapperClass = 'vk-lastfm-recommendations'

const wrapper = document.createElement('div')
wrapper.setAttribute('class', wrapperClass)
document.body.appendChild(wrapper)

ReactDOM.render(
    <App/>,
    document.querySelector(`.${wrapperClass}`)
)
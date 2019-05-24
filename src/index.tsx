import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Provider} from 'react-redux'

import store from './redux/store'
import {App} from './app'

const wrapperClass = 'vk-lastfm-recommendations'

const wrapper = document.createElement('div')
wrapper.setAttribute('class', wrapperClass)
document.body.appendChild(wrapper)

ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.querySelector(`.${wrapperClass}`)
)
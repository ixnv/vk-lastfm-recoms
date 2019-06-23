import styled from 'styled-components'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import AppContext, {AppState} from '../AppContextProvider'

export const RecommendButtonClass = 'vk-lastfm-recommend-button'

const Button = styled.button`
    background: url(data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2014%2014%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M9.5%2010.9C8.5%2011.6%207.3%2012%206%2012C2.7%2012%200%209.3%200%206C0%202.7%202.7%200%206%200C9.3%200%2012%202.7%2012%206C12%207.3%2011.6%208.5%2010.9%209.5L13.7%2012.2C14%2012.6%2014.1%2013.3%2013.7%2013.7C13.3%2014%2012.6%2014%2012.2%2013.7L9.5%2010.9ZM6%2010C8.2%2010%2010%208.2%2010%206C10%203.8%208.2%202%206%202C3.8%202%202%203.8%202%206C2%208.2%203.8%2010%206%2010Z%22%20fill%3D%22%239299A6%22%2F%3E%3Cpath%20d%3D%22M7.57898%207.99927C8.52612%207.99927%209%207.6203%209%206.86165C9%206.24079%208.69939%205.84644%208.09755%205.67785L7.64633%205.56276C7.39653%205.4858%207.27163%205.32527%207.27163%205.07971C7.27163%204.79604%207.42837%204.65457%207.74184%204.65457C8.08714%204.65457%208.26959%204.81583%208.28918%205.13762L8.98041%205.046C8.93571%204.34891%208.53898%204%207.7902%204C6.98388%204%206.58041%204.39875%206.58041%205.19553C6.58041%205.76287%206.84306%206.12278%207.36776%206.27598L7.83796%206.37933C8.15816%206.47095%208.31796%206.64394%208.31796%206.89683C8.31796%207.1959%208.07184%207.34543%207.57898%207.34543C6.97714%207.34543%206.58041%206.99652%206.38878%206.29943L6.15857%205.47187C6.01776%204.92798%205.83837%204.54462%205.62102%204.32252C5.41592%204.10775%205.08041%204.00073%204.61327%204.00073C4.18469%204.00073%203.81%204.18838%203.4898%204.56368C3.16347%204.93898%203%205.44108%203%206.06927C3%206.65934%203.15367%207.12699%203.46102%207.4715C3.76163%207.82408%204.12959%208%204.5649%208C4.98735%208%205.32653%207.87759%205.58245%207.63203L5.37122%206.91955C5.14714%207.18783%204.88816%207.32197%204.59367%207.32197C4.3249%207.32197%204.10265%207.19736%203.92633%206.94814C3.75061%206.69892%203.66245%206.39839%203.66245%206.04581C3.66245%205.57083%203.76163%205.22631%203.96%205.01154C4.1651%204.78944%204.38857%204.67803%204.63225%204.67803C4.90102%204.67803%205.09633%204.76232%205.21755%204.93091C5.32653%205.09951%205.43184%205.36778%205.53408%205.73575L5.7551%206.55159C6.0049%207.51695%206.61286%207.99927%207.57898%207.99927Z%22%20fill%3D%22%239299A6%22%2F%3E%3C%2Fsvg%3E) no-repeat 50%;
    display: inline;
`

type Props = {
    parentEl: HTMLDivElement
}

export default class RecommendButton extends React.Component<Props> {
    public state = {
        track: {
            title: '',
            artist: ''
        }
    }

    private readonly el: HTMLDivElement
    private readonly parentEl: HTMLDivElement

    constructor(props: Props) {
        super(props)

        this.el = document.createElement('div')
        this.el.style.display = 'inline-block'
        this.parentEl = props.parentEl
    }

    public componentDidMount(): void {
        this.parentEl.appendChild(this.el)
    }

    public componentWillUnmount(): void {
        this.parentEl.removeChild(this.el)
    }

    public render() {
        return ReactDOM.createPortal(
            <AppContext.Consumer>
                {
                    (appState: AppState) => {
                        const handleMouseUp = () => {
                            appState.updateTrack(this.state.track)
                            appState.updateDialogOpened(true)
                        }

                        return (
                            <Button className={`${RecommendButtonClass} audio_row__action`}
                                    title='Показать похожие из Last FM'
                                    onMouseUp={handleMouseUp}/>
                        )
                    }
                }
            </AppContext.Consumer>,
            this.el
        )
    }
}
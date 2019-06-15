import * as React from 'react'
import styled from 'styled-components'
import AppContext, {State} from '../AppContextProvider'

const Wrapper = styled.div`
    float: right;
    margin: 5px 7px 0;
`

const Actions = styled.div`
    width: 12px;
    height: 12px;
    margin-left: 2px;
    cursor: pointer;
    display: inline-block;
    
    > svg {
        width: 12px !important;
        height: 12px !important;
    }
`

const CloseButton = styled(Actions)`
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2236%22%20height%3D%2236%22%20viewBox%3D%22940%20104%2036%2036%22%3E%3Cg%20style%3D%22fill%3Anone%3B%22%3E%3Crect%20x%3D%22940%22%20y%3D%22104%22%20width%3D%2236%22%20height%3D%2236%22%2F%3E%3Cg%20fill%3D%22%239aa1ad%22%3E%3Cpath%20d%3D%22M968.1%20129.9L950.1%20111.9C949.5%20111.4%20948.5%20111.4%20947.9%20111.9%20947.4%20112.5%20947.4%20113.5%20947.9%20114.1L965.9%20132.1C966.5%20132.6%20967.5%20132.6%20968.1%20132.1%20968.6%20131.5%20968.6%20130.5%20968.1%20129.9Z%22%2F%3E%3Cpath%20d%3D%22M950.1%20132.1L968.1%20114.1C968.6%20113.5%20968.6%20112.5%20968.1%20111.9%20967.5%20111.4%20966.5%20111.4%20965.9%20111.9L947.9%20129.9C947.4%20130.5%20947.4%20131.5%20947.9%20132.1%20948.5%20132.6%20949.5%20132.6%20950.1%20132.1Z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E") no-repeat 50%;
`

const MaximizeButton = styled(Actions)``

const ClearFix = styled.div`
    clear: both;
`

const Info = styled.div`
    padding: 0 10px;
    line-height: 35px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

class ResultMinimized extends React.Component {
    public render() {
        return (
            <AppContext.Consumer>
                {
                    (sharedState: State) => {
                        const track = sharedState.track

                        if (track === undefined) {
                            return
                        }

                        console.log('min', track)

                        return (
                            <>
                                <Wrapper>
                                    <MaximizeButton>
                                        <svg className='videoplayer_btn_icon videoplayer_expand_icon'
                                             viewBox='729 480 16 16'
                                             xmlns='http://www.w3.org/2000/svg' focusable='false'>
                                            <path
                                                d='M729 481.994c0-1.1.895-1.994 1.994-1.994h12.012c1.1 0 1.994.895 1.994 1.994v12.012c0 1.1-.895 1.994-1.994 1.994h-12.012c-1.1 0-1.994-.895-1.994-1.994v-12.012zm2 4.004c0-.55.456-.998 1.002-.998h9.996c.553 0 1.002.446 1.002.998v7.004c0 .55-.456.998-1.002.998h-9.996c-.553 0-1.002-.446-1.002-.998v-7.004z'
                                                fill='#9aa1ad' fillRule='evenodd'/>
                                        </svg>
                                    </MaximizeButton>
                                    <CloseButton/>
                                </Wrapper>
                                <ClearFix/>
                                <Info>Похожие
                                    на <strong>{track && track.artist}&mdash;{track && track.title}</strong></Info>
                            </>
                        )
                    }
                }
            </AppContext.Consumer>
        )
    }
}

export default ResultMinimized
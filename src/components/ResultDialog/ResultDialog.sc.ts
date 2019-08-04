import styled from 'styled-components'

export const Dialog = styled.div`
    position: relative;
    z-index: 999;
    margin: 25px auto 10px;
    width: 560px;
    min-height: 300px;
    background-color: white;
    border-radius: 3px;
`

export const Content = styled.div`
    padding: 10px;
`

export const Info = styled.h3`
    padding: 0 10px;
`

export const AudioRowList = styled.div`
    padding: 8px 0;
`

export const NoResult = styled.div`
    text-align: center;
    height: 10em;
    line-height: 10em;
`

export const Error = styled.div`
    text-align: center;
    height: 10em;
    padding: 5em 0 0 0;
`

export const RetryButton = styled.button`
    margin-top: 1em;
`

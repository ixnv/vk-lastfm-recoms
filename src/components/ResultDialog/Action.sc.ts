import styled from 'styled-components'

const Action = styled.button`
    position: absolute;
    right: -60px;
    width: 60px;
    height: 50px;
    cursor: pointer;
    border: none;
    opacity: 0.5;
    transition: opacity 60ms linear;
    
    &:hover {
        opacity: 1;
    }
`

export default Action

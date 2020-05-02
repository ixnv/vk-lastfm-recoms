import React from 'react'
import styled, { Keyframes, keyframes } from 'styled-components'

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
`

const Loader = styled.div`
    position: relative;
    display: inline-block;
    height: 36px;
    width: 64px;

    & div {
        animation-timing-function: cubic-bezier(0, 1, 1, 0);
        background: #2a5885;
        border-radius: 50%;
        height: 11px;
        position: absolute;
        top: 18px;
        width: 11px;
    }
`

const piece1Animation = keyframes`
    0% {
        transform: scale(0);
    }
    100% {
        transform: scale(1);
    }
`

const piece2Animation = keyframes`
    0% {
        transform: translate(0, 0);
    }
    100% {
        transform: translate(19px, 0);
    }
`

const piece3Animation = keyframes`
    0% {
        transform: scale(1);
    }
    100% {
        transform: scale(0);
    }
`

type AnimationProps = {
  childIndex: number
  animation: Keyframes
  left: string
}

const Piece = styled(Loader)`
    &:nth-child(${(props: AnimationProps) => props.childIndex}) {
        animation: ${(props: AnimationProps) => props.animation} 0.6s infinite;
        left: ${(props: AnimationProps) => props.left};
        will-change: transform;
    }
`

const LoaderComponent: React.FC = () => {
  const pieces = [
    { animation: piece1Animation, left: '6px' },
    { animation: piece2Animation, left: '6px' },
    { animation: piece2Animation, left: '26px' },
    { animation: piece3Animation, left: '45px' }
  ]

  return (
    <Wrapper>
      <Loader>
        {
          pieces.forEach((piece, index) =>
            <Piece key={index} childIndex={index + 1} animation={piece.animation} left={piece.left}/>
          )
        }
        <Piece childIndex={1} animation={piece1Animation} left='6px'/>
        <Piece childIndex={2} animation={piece2Animation} left='6px'/>
        <Piece childIndex={3} animation={piece2Animation} left='26px'/>
        <Piece childIndex={4} animation={piece3Animation} left='45px'/>
      </Loader>
    </Wrapper>
  )
}

export default LoaderComponent

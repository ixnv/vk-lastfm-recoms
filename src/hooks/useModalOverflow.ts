import { useEffect } from 'react'
import { addCssToElement } from '../util'

export const useModalOverflow = () => {
  useEffect(() => {
    addCssToElement('body', { overflowY: 'hidden' })
    return () => {
      addCssToElement('body', { overflow: 'auto' })
    }
  }, [])
}

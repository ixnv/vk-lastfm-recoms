import * as React from 'react'
import {shallow} from 'enzyme'
import ResultDialog from '../../src/components/ResultDialog'

test('<ResultDialog/> renders without crash', () => {
    const loader = shallow(<ResultDialog/>)

    expect(loader).toMatchSnapshot()
})
import * as React from 'react'
import {shallow} from 'enzyme'
import Loader from '../../src/components/ResultDialog/Loader'

test('<Loader/> renders without crash', () => {
    const loader = shallow(<Loader/>)

    expect(loader).toMatchSnapshot()
})

import * as React from 'react'
import {shallow} from 'enzyme'
import Loader from '../../src/components/Loader'

test('<Loader/> renders without crash', () => {
    const loader = shallow(<Loader show={true}/>)

    expect(loader).toMatchSnapshot()
})
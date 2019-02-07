const handler = require("./index.js").handler

// import handler from 'index'

async function test(event, context, callback) {
    return await handler(event, context, callback)
}

const event = {
    httpMethod: 'GET',
    queryStringParameters: {
        artist: 'Sentence',
        track: 'Azimuth',
        unwanted: '["Oxxxymiron"]'
    }
}

test(event, null, (response) => console.log(response))

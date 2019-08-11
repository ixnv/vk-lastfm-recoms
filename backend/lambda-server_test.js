const {handler} = require("./index.js")

async function test(event, context, callback) {
    return await handler(event, context, callback)
}

const event = {
    httpMethod: 'GET',
    queryStringParameters: {
        artist: 'Kyivstoner',
        track: 'О лени',
        unwanted: '["Oxxxymiron"]'
    }
}

test(event, null, (fuck, response) => {
    console.log(response)
})

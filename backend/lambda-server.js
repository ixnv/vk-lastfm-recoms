import getTracks from "./index";

exports.handler = async (event, context, callback) => {
    if (event.httpMethod !== 'GET') {
        return callback(null, {
            statusCode: 405,
            body: JSON.stringify({'error': 'not allowed'}),
            headers: {
                'Content-Type': 'application/json',
            }
        })
    }

    let {
        artist,
        track,
        unwanted,
        version
    } = event.queryStringParameters

    const response = await getTracks(artist, track, unwanted)

    let res;

    if (version >= 1.4) {
        res = {
            tracks: response.tracks,
            canFetchMoreTracks: response.canFetchMoreTracks
        }
    } else {
        res = {
            response: response.tracks
        }
    }

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
}

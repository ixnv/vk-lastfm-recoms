const express = require('express')
const app = express()
const getTracks = require('./index')

app.get('/similar-tracks', async function (req, res) {
    const {artist, track, unwanted} = req.query

    const response = await getTracks(artist, track, unwanted)

    res.setHeader('Content-Type', 'application/json')
    res.status(200).end(JSON.stringify({
        tracks: response.tracks,
        canFetchMoreTracks: response.canFetchMoreTracks
    }))
})

app.listen(3000)


require('dotenv').config()
const fs = require('fs');
const archiver = require('archiver')

const output = fs.createWriteStream(__dirname + '/target.zip')
const archive = archiver('zip', {
    zlib: {level: 9}
})

output.on('close', () => {
    const zipFile = fs.createReadStream(__dirname + '/target.zip')
    const webStore = require('chrome-webstore-upload')({
        extensionId: process.env.CHROME_STORE_CLIENT_ID,
        clientId: process.env.CHROME_STORE_CLIENT_ID,
        clientSecret: process.env.CHROME_STORE_CLIENT_SECRET,
        refreshToken: process.env.CHROME_STORE_REFRESH_TOKEN
    }).uploadExisting()

    webStore.uploadExisting(zipFile).then(() => {
        console.log('UPLOADED')
    })
})

archive.directory(__dirname + 'dist/', '.', {})
archive.finalize()

archive.on('error', function (err) {
    throw err
})

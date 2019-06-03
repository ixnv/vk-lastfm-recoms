import {Track} from '../types'

const apiRoot = process.env.RECOMMENDATIONS_API_ROOT

export async function getTracks({title, artist}: Track) {
    return await fetch(`${apiRoot}/similar-tracks?artist=${artist}&track=${title}`)
        .then(response => {
            if (response.status !== 200) {
                throw response
            }

            try {
                return response.json()
            } catch (e) {
                // could not parse
                throw e
            }
        })
        .then(response => ({
            error: false,
            response
        }))
        .catch(response => {
            console.error(response)
            return {
                error: true,
                response
            }
        })
}

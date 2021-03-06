import { getOrElse, none, Option, some } from 'fp-ts/lib/Option'
import { Track } from '../shared'
import levenshtein from 'js-levenshtein'
import { pipe } from 'fp-ts/lib/pipeable'
import { sentryError } from '../logger/sentry'

export function getUserId (): Option<string> {
  const audioPageLink = document.querySelector('#l_aud > a') as HTMLAnchorElement
  if (!audioPageLink) {
    return none
  }

  return some(audioPageLink.href.substring(21))
}

export async function searchTrack (track: Track): Promise<Option<HTMLDivElement>> {
  const q = encodeURIComponent(`${track.artist} ${track.title}`)
  // user can switch accounts at any time, can't 'maybeTrack' it, therefore we need to get user id on every search
  const userId = pipe(
    getUserId(),
    getOrElse(() => '')
  )

  return await fetch('https://vk.com/al_audio.php', {
    'credentials': 'include',
    'referrer': `https://vk.com/audios${userId}`,
    'body': `act=section&al=1&claim=0&is_layer=0&owner_id=${userId}&q=${q}&section=search`,
    'method': 'POST',
    'mode': 'cors',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(
    // decode to utf-8
    async body => body.arrayBuffer().then(data => (new TextDecoder('windows-1251')).decode(data))
  ).then(response => {
    let parsed
    try {
      // remove '<!--'
      parsed = JSON.parse(response.substring(4))
    } catch (e) {
      sentryError({ track: q }, e)
      return none
    }

    // errrh...
    const responseHTML: string = parsed.payload[1][0]

    if (!parsed.payload || !responseHTML) {
      return none
    }

    const html = document.createElement('html')
    html.innerHTML = responseHTML
    const audioRows = html.querySelectorAll('.audio_row') as NodeList

    const distances = {}

    // filter by artist name, bc VK searches by entry not linearly
    // @ts-ignore
    for (const audioRow of audioRows) {
      const audioRowInfo = audioRow.children[0].children[6].children[0]
      const performer = audioRowInfo.children[0].textContent.trim().toLowerCase()
      const search = track.artist.toLowerCase()

      /**
       * use levenshtein distance for filtering artists
       * because sometimes VK gives you completely non-related tracks in search results
       * ex. search for "Skin Area - In the Skin" first result would be "Linkin Park & Eminem - Skin to Bone"
       */
      const distance = levenshtein(search, performer)
      if (!distances.hasOwnProperty(distance)) {
        if (distance === 0) {
          return some(audioRow)
        }

        distances[distance] = audioRow
      }
    }

    const minDistance = Math.min(...Object.keys(distances).map(x => +x))
    // Math.min returns Infinity on []
    if (minDistance !== Infinity && minDistance < track.artist.length) {
      return some(distances[minDistance])
    }

    return none
  })
}

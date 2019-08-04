export const wrapperClass = 'vk-lastfm-recommendations'

export type Track = {
    artist: string
    title: string
}

export const defaultTrack: Readonly<Track> = {
    title: '',
    artist: ''
}

export const shuffle = arr => [...arr].sort(() => 0.5 - Math.random())

export const objectToQueryString = obj => {
    Object.keys(obj).reduce((acc, k) => {
        acc.push(`${k}=${obj[k]}`)
        return acc
    }, []).join('&')
}

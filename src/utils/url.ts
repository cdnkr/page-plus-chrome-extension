export function formatUrlForDisplay(url: string, limit = 200) {
    url = url
        .replace(/http?(s):\/\//g, '')
        .replace(/www\./g, '')

    return url.length > limit ? `${url.slice(0, limit)}...` : url
}

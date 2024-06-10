import url from './url_params.json';

function getHostPath() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    if (protocol === "http:") {
        return `${protocol}//${hostname}:${url.httpPort}`;
    } else {
        return `${protocol}//${hostname}:${url.httpsPort}`;
    }
}

export default getHostPath;
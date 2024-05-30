import url from './url_params.json';

function getHostPath() {
    const protocol = window.location.protocol;
    if (protocol === "http:") {
        return `${protocol}//${url.host}:${url.httpPort}`;
    } else {
        return `${protocol}//${url.host}:${url.httpsPort}`;
    }
}

export default getHostPath;
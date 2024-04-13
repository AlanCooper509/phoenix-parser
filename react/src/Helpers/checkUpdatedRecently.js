function checkUpdatedRecently(timestamp, timeoutSeconds) {
    const current_timestamp = Date.now() / 1000;
    return (current_timestamp - timeoutSeconds) < timestamp;
}

export default checkUpdatedRecently;
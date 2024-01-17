function createSyncUserResponse(syncData) {
    return {
        info: syncData.info,
        titles: syncData.titles.length,
        scores: syncData.scores.count
    }
}

export default createSyncUserResponse;
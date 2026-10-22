// sync failures, in the { error: { code, message } } shape endpoints resolve to

export function ERROR_400(msg) {
    return {
        error: {
            code: 400,
            message: msg
        }
    }
}

export const ERROR_500 = {
    error: {
        code: 500,
        message: "Internal Error... Please try again later."
    }
}

export const ERROR_503 = {
    error: {
        code: 503,
        message: "Syncing is not available right now. Please try again later."
    }
}

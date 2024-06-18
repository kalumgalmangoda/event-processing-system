const TAG = "EVENT_SERVICE"
const log = (...payload) => {
    console.log(`${TAG} ${JSON.stringify(payload)}`);
};

const debug = (...payload) => {
    console.debug(`${TAG} ${JSON.stringify(payload)}`);
};

const info = (...payload) => {
    console.info(`${TAG} ${JSON.stringify(payload)}`);
};

const warn = (...payload) => {
    console.warn(`${TAG} ${JSON.stringify(payload)}`);
};

const error = (...payload) => {
    console.error(`${TAG} ${JSON.stringify(payload)}`);
};

module.exports = {
    log,
    debug,
    info,
    warn,
    error
};
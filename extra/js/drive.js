// https://stackoverflow.com/a/9458996
function _bytesToBase64(bytes) {
    var binary = '';
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// https://stackoverflow.com/a/21797381
function _base64ToBytes(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

window.loadFileAsync = function(fullPath, callback) {
    // Make cache object
    if (!window.fileAsyncCache) window.fileAsyncCache = {};

    // Check if already loaded
    if (window.fileAsyncCache.hasOwnProperty(fullPath)) return callback();

    // Show spinner
    if (window.setBusy) window.setBusy();

    // Get mapping key
    const mappingKey = fullPath.toLowerCase().replace(new RegExp("\\.[^/.]+$"), "");
    const mappingValue = mapping[mappingKey];

    // Check if this is a folder
    if (!mappingValue || mappingValue.endsWith("h=")) {
        console.error("Skipping loading", fullPath, mappingValue);
        return callback();
    }

    // Get target URL
    const iurl = "gameasync/" + mappingValue;

    // Get path and filename
    const path = "/game/" + mappingValue.substring(0, mappingValue.lastIndexOf("/"));
    const filename = mappingValue.substring(mappingValue.lastIndexOf("/") + 1).split("?")[0];

    // Delete original file if existent
    try {
        FS.unlink(path + "/" + filename);
    } catch (err) {}

    // Get the new file
    getLazyAsset(iurl, filename, () => {
        FS.createPreloadedFile(path, filename, iurl, true, true, function() {
            window.fileAsyncCache[fullPath] = 1;
            if (window.setNotBusy) window.setNotBusy();
            if (window.fileLoadedAsync) window.fileLoadedAsync(fullPath);
            callback();
        }, console.error);
    });
}

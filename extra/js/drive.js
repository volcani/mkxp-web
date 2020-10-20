// Canvas used for image generation
var generationCanvas = document.createElement('canvas')
window.fileAsyncCache = {};

window.getMappingKey = function(file) {
    return file.toLowerCase().replace(new RegExp("\\.[^/.]+$"), "")
}

window.loadFileAsync = function(fullPath, bitmap, callback) {
    // noop
    callback = callback || (() => {});

    // Get mapping key
    const mappingKey = getMappingKey(fullPath);
    const mappingValue = mapping[mappingKey];

    // Check if already loaded
    if (window.fileAsyncCache.hasOwnProperty(mappingKey)) return callback();

    // Show spinner
    if (!bitmap && window.setBusy) window.setBusy();

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

    // Main loading function
    const load = (cb1) => {
        getLazyAsset(iurl, filename, (data) => {
            FS.createPreloadedFile(path, filename, new Uint8Array(data), true, true, function() {
                window.fileAsyncCache[mappingKey] = 1;
                if (!bitmap && window.setNotBusy) window.setNotBusy();
                if (window.fileLoadedAsync) window.fileLoadedAsync(fullPath);
                callback();
                if (cb1) cb1();
            }, console.error, false, false, () => {
                try { FS.unlink(path + "/" + filename); } catch (err) {}
            });
        });
    }

    // Show progress if doing it synchronously only
    if (bitmap && bitmapSizeMapping[mappingKey]) {
        // Get image
        const sm = bitmapSizeMapping[mappingKey];
        generationCanvas.width = sm[0];
        generationCanvas.height = sm[1];

        // Draw
        var img = new Image;
        img.onload = function(){
            const ctx = generationCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, sm[0], sm[1]);

            // Create dummy from data uri
            FS.createPreloadedFile(path, filename, generationCanvas.toDataURL(), true, true, function() {
                // Return control to C++
                callback(); callback = () => {};

                // Lazy load and refresh
                load(() => {
                    const reloadBitmap = Module.cwrap('reloadBitmap', 'number', ['number'])
                    reloadBitmap(bitmap);
                });
            }, console.error, false, false, () => {
                try { FS.unlink(path + "/" + filename); } catch (err) {}
            });
        };

        img.src = sm[2];
    } else {
        if (bitmap) {
            console.warn('No sizemap for image', mappingKey);
        }
        load();
    }
}


window.saveFile = function(filename) {
    const buf = FS.readFile('/game/' + filename);
    localforage.setItem(namespace + filename, buf);

    localforage.getItem(namespace, function(err, res) {
        if (err || !res) res = {};
        res[filename] = 1;
        localforage.setItem(namespace, res);
    });

    (window.saveCloudFile || (()=>{}))(filename, buf);
};

var loadFiles = function() {
    localforage.getItem(namespace, function(err, res) {
        if (err || !res) return;

        const keys = Object.keys(res);

        console.log('Locally stored savefiles', keys);

        keys.forEach((key) => {
            localforage.getItem(namespace + key, (err, res) => {
                if (err) return;

                // Don't overwrite existing files
                const fname = '/game/' + key;
                if (FS.analyzePath(fname).exists) return;

                FS.writeFile(fname, res);
            });
        });
    });

    (window.loadCloudFiles || (()=>{}))();
}

var createDummies = function() {
    // Base directory
    FS.mkdir('/game');

    // Create dummy objects
    Object.values(mapping).forEach((file) => {
        // Get filename
        const filename = '/game/' + file.split("?")[0];

        // Check if folder
        if (file.endsWith('h=')) {
            return FS.mkdir(filename);
        }

        // Create dummy file
        FS.writeFile(filename, '1');
    });
};

window.setBusy = function() {
    document.getElementById('spinner').style.opacity = "0.5";
};

window.setNotBusy = function() {
    document.getElementById('spinner').style.opacity = "0";
};

window.onerror = function() {
    console.error("An error occured!")
};

function preloadList(jsonArray) {
    jsonArray.forEach((file) => {
        const mappingKey = getMappingKey(file);
        const mappingValue = mapping[mappingKey];
        if (!mappingValue || window.fileAsyncCache[mappingKey]) return;

        // Get path and filename
        const path = "/game/" + mappingValue.substring(0, mappingValue.lastIndexOf("/"));
        const filename = mappingValue.substring(mappingValue.lastIndexOf("/") + 1).split("?")[0];

        // Preload the asset
        FS.createPreloadedFile(path, filename, "gameasync/" + mappingValue, true, true, function() {
            window.fileAsyncCache[mappingKey] = 1;
        }, console.error, false, false, () => {
            try { FS.unlink(path + "/" + filename); } catch (err) {}
        });
    });
}

window.fileLoadedAsync = function(file) {
    document.title = wTitle;

    if (!(/.*Map.*rxdata/i.test(file))) return;

    fetch('preload/' + file + '.json')
        .then(function(response) {
            return response.json();
        })
        .then(function(jsonResponse) {
            setTimeout(() => {
                preloadList(jsonResponse);
            }, 200);
        });
};

var hideTimer = 0;
function getLazyAsset(url, filename, callback) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    const pdiv = document.getElementById("progress");
    let showTimer = 0;
    let abortTimer = 0;

    const retry = () => {
        xhr.abort();
        getLazyAsset(url, filename, callback);
    }

    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status >= 200 && xhr.status < 400) {
            pdiv.innerHTML = `${filename} - done`;
            hideTimer = setTimeout(() => {
                pdiv.style.opacity = '0';
                hideTimer = 0;
            }, 500);
            clearTimeout(showTimer);
            clearTimeout(abortTimer);
            callback(xhr.response);
        }
    }
    xhr.onprogress = function (event) {
        const loaded = Math.round(event.loaded / 1024);
        const total = Math.round(event.total / 1024);
        pdiv.innerHTML = `${filename} - ${loaded}KB / ${total}KB`;

        clearTimeout(abortTimer);
        abortTimer = setTimeout(retry, 10000);
    };
    xhr.open('GET', url);
    xhr.send();

    pdiv.innerHTML = `${filename} - starting`;

    showTimer = setTimeout(() => {
        pdiv.style.opacity = '0.5';
    }, 100);

    abortTimer = setTimeout(retry, 10000);

    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = 0;
    }
}

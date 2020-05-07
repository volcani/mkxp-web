#include "emscripten.hpp"

#ifdef __EMSCRIPTEN__

EM_JS(void, load_file_async_js, (const char* fullPathC), {
	Asyncify.handleSleep(function(wakeUp) {
		// Get argument
		const fullPath = UTF8ToString(fullPathC);

		// Make cache object
		if (!window.fileAsyncCache) window.fileAsyncCache = {};

		// Check if already loaded
		if (window.fileAsyncCache.hasOwnProperty(fullPath)) return wakeUp();

		// Show spinner
		if (window.setBusy) window.setBusy();

		// Get mapping key
		const mappingKey = fullPath.toLowerCase().replace(new RegExp("\\\\.[^/.]+$"), "");
		const mappingValue = mapping[mappingKey];

		// Check if this is a folder
		if (!mappingValue || mappingValue.endsWith("h=")) {
			console.error("Skipping loading", fullPath, mappingValue);
			return wakeUp();
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
				wakeUp();
			}, console.error);
		});
	});
});

EM_JS(void, save_file_async_js, (const char* fullPathC), {
	if (window.saveFile) window.saveFile(UTF8ToString(fullPathC));
});

#endif


#include "emscripten.hpp"
#include "filesystem.h"
#include "sharedstate.h"

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

		// Get full destination
		const file = "game/" + fullPath;

		// Get path and filename
		const path = "/" + file.substring(0, file.lastIndexOf("/"));
		const filename = file.substring(file.lastIndexOf("/") + 1);

		// Get target URL
		const iurl = "gameasync/" + fullPath;

		// Delete original file if existent
		try {
			FS.unlink(path + "/" + filename);
		} catch (err) {}

		// Get the new file
		FS.createPreloadedFile(path, filename, iurl, true, true, function() {
			window.fileAsyncCache[fullPath] = 1;
			if (window.setNotBusy) window.setNotBusy();
			if (window.fileLoadedAsync) window.fileLoadedAsync(fullPath);
			wakeUp();
		}, console.error);
	});
});

struct LoadOpenHandler : FileSystem::OpenHandler
{
	LoadOpenHandler()
	{}

	bool tryRead(SDL_RWops &ops, const char *ext, const char *fullPath)
	{
		load_file_async_js(fullPath);
		return true;
	}
};

void load_file_async(const char * filename) {
	LoadOpenHandler handler;
	shState->fileSystem().openRead(handler, filename);
}

EM_JS(void, save_file_async_js, (const char* fullPathC), {
	if (window.saveFile) window.saveFile(UTF8ToString(fullPathC));
});

#endif


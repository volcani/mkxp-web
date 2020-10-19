#include "emscripten.hpp"

#ifdef __EMSCRIPTEN__

EM_JS(void, load_file_async_js, (const char* fullPathC, int bitmap), {
	Asyncify.handleSleep(function(wakeUp) {
    	window.loadFileAsync(UTF8ToString(fullPathC), bitmap, wakeUp);
	});
});

EM_JS(void, save_file_async_js, (const char* fullPathC), {
	if (window.saveFile) window.saveFile(UTF8ToString(fullPathC));
});

#endif


#ifndef EMSCRIPTEN_HPP
#define EMSCRIPTEN_HPP

#ifdef __EMSCRIPTEN__
#include <emscripten.h>

extern "C" {
	void load_file_async_js(const char* fullPathC, int bitmap=0);

	void save_file_async_js(const char* fullPathC);
}

#endif

#endif


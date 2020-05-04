#ifndef EMSCRIPTEN_HPP
#define EMSCRIPTEN_HPP

#ifdef __EMSCRIPTEN__
#include <emscripten.h>

extern "C" {
	void load_file_async(const char* fullPathC);
}

#endif

#endif


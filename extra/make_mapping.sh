#!/bin/bash

echo "var mapping = {" > mapping.js

for file in {*,*/*,*/**/*}
do

filename="${file%.*}"
fl="$(echo "$filename" | tr '[:upper:]' '[:lower:]')"
md5=`md5sum "${file}" | awk '{ print $1 }'`

echo "\"$fl\": \"${file}?h=${md5}\"," >> mapping.js

done

echo "};" >> mapping.js


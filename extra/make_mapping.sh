#!/bin/bash

echo "var mapping = {" > mapping.js
echo "var bitmapSizeMapping = {" > bitmap-map.js

for file in {*,*/*,*/**/*}
do

filename="${file%.*}"
fl="$(echo "$filename" | tr '[:upper:]' '[:lower:]')"

if [ -f $file ]
then
    md5=`md5sum "${file}" | awk '{ print $1 }'`
else
    md5=''
fi

echo "\"$fl\": \"${file}?h=${md5}\"," >> mapping.js

if [ -f $file ]
then
    sz=`identify -format "%w,%h" "${file}" 2>/dev/null`
    if [ $? -eq 0 ]; then
        echo "\"$fl\": [${sz}]," >> bitmap-map.js
    fi
fi

done

echo "};" >> mapping.js
echo "};" >> bitmap-map.js


VERSION = 0.1.0
BUILD_DIR = ./build
OUTPUT = ${BUILD_DIR}/bitdeli-dom-${VERSION}

all: build compile

clean:
	rm -f ${OUTPUT}.js ${OUTPUT}.min.js

build: clean
	mkdir -p ${BUILD_DIR}
	ender build . --output ${OUTPUT} --sandbox --minifier none

compile:
	ender compile --use ${OUTPUT}.js --output ${OUTPUT}.min.js --level simple

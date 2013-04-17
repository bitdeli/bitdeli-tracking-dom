JavaScript tracking library for Bitdeli
=======================================

**This library is currently only available as a developer preview
for beta users of Bitdeli.**

[Let us know](mailto:support@bitdeli.com)
if you want access to the beta version of Bitdeli. The basic version
of the JavaScript tracking library (without automatic DOM event
tracking) can be found at
[bitdeli/bitdeli-tracking-js](https://github.com/bitdeli/bitdeli-tracking-js).

[Bitdeli Home](https://bitdeli.com)


## Documentation ##

See the complete Bitdeli documentation at https://bitdeli.com/docs/

- [Setup Instructions](https://bitdeli.com/docs/javascript-library.html)
- [JavaScript Library API Reference](https://bitdeli.com/docs/javascript-api.html)


## Developers ##

_Please note: The following instructions are intended for developers contributing to this library. To use the library to track events on your website please refer to the official documentation._

This library uses the [Ender](http://ender.jit.su/) package manager to compile multiple modules to one distributable file. To install the latest version of Ender, run the following [npm](https://npmjs.org/) command (you may have to use `sudo` to install the package globally):

```
[sudo] npm install ender -g
```

_These build instructions have been tested to work on version `1.0.0` of the `ender` package._

To build and compile the library and its dependencies, run the included Makefile:

```
make
```

This will automatically download and install the required Ender packages under the `node_modules` subfolder.

After the build process is complete, both a development build and a minified production build can be found in the `build` subfolder.


## Contributing ##

To suggest a feature or report a bug, visit the [Issues page](https://github.com/bitdeli/bitdeli-tracking-dom/issues).


## Copyright and License ##

Copyright 2013 Bitdeli Inc.

[MIT License](https://github.com/bitdeli/bitdeli-tracking-dom/blob/master/LICENSE)


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/bitdeli/bitdeli-tracking-dom/trend.png)](https://bitdeli.com/free "Bitdeli Badge")


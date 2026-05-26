module.exports = [
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[project]/node_modules/ffmpeg-static/package.json.[json].cjs [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    "name": "ffmpeg-static",
    "version": "5.3.0",
    "description": "ffmpeg binaries for macOS, Linux and Windows",
    "scripts": {
        "install": "node install.js",
        "prepublishOnly": "npm run install"
    },
    "ffmpeg-static": {
        "binary-path-env-var": "FFMPEG_BIN",
        "binary-release-tag-env-var": "FFMPEG_BINARY_RELEASE",
        "binary-release-tag": "b6.1.1",
        "binaries-url-env-var": "FFMPEG_BINARIES_URL",
        "executable-base-name": "ffmpeg"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/eugeneware/ffmpeg-static"
    },
    "keywords": [
        "ffmpeg",
        "static",
        "binary",
        "binaries",
        "mac",
        "linux",
        "windows"
    ],
    "authors": [
        "Eugene Ware <eugene@noblesamurai.com>",
        "Jannis R <mail@jannisr.de>"
    ],
    "contributors": [
        "Thefrank (https://github.com/Thefrank)",
        "Emil Sivervik <emil@sivervik.com>"
    ],
    "license": "GPL-3.0-or-later",
    "bugs": {
        "url": "https://github.com/eugeneware/ffmpeg-static/issues"
    },
    "engines": {
        "node": ">=16"
    },
    "dependencies": {
        "@derhuerst/http-basic": "^8.2.0",
        "env-paths": "^2.2.0",
        "https-proxy-agent": "^5.0.0",
        "progress": "^2.0.3"
    },
    "devDependencies": {
        "any-shell-escape": "^0.1.1"
    },
    "main": "index.js",
    "files": [
        "index.js",
        "install.js",
        "example.js",
        "types"
    ],
    "types": "types/index.d.ts"
};
}),
"[project]/node_modules/ffmpeg-static/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const pkg = __turbopack_context__.r("[project]/node_modules/ffmpeg-static/package.json.[json].cjs [app-rsc] (ecmascript)");
const { 'binary-path-env-var': BINARY_PATH_ENV_VAR, 'executable-base-name': executableBaseName } = pkg[pkg.name];
if ('string' !== typeof BINARY_PATH_ENV_VAR) {
    throw new Error(`package.json: invalid/missing ${pkg.name}.binary-path-env-var entry`);
}
if ('string' !== typeof executableBaseName) {
    throw new Error(`package.json: invalid/missing ${pkg.name}.executable-base-name entry`);
}
if (process.env[BINARY_PATH_ENV_VAR]) {
    module.exports = process.env[BINARY_PATH_ENV_VAR];
} else {
    var os = __turbopack_context__.r("[externals]/os [external] (os, cjs)");
    var path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
    var binaries = Object.assign(Object.create(null), {
        darwin: [
            'x64',
            'arm64'
        ],
        freebsd: [
            'x64'
        ],
        linux: [
            'x64',
            'ia32',
            'arm64',
            'arm'
        ],
        win32: [
            'x64',
            'ia32'
        ]
    });
    var platform = process.env.npm_config_platform || os.platform();
    var arch = process.env.npm_config_arch || os.arch();
    let binaryPath = path.join(("TURBOPACK compile-time value", "/ROOT/node_modules/ffmpeg-static"), executableBaseName + (platform === 'win32' ? '.exe' : ''));
    if (!binaries[platform] || binaries[platform].indexOf(arch) === -1) {
        binaryPath = null;
    }
    module.exports = binaryPath;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__033xhvf._.js.map
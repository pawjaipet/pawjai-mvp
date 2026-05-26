module.exports = [
"[project]/node_modules/heic-convert/index.js [app-rsc] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/node_modules_libheif-js_libheif-wasm_libheif-bundle_0zshsmd.js",
  "server/chunks/ssr/node_modules_libheif-js_wasm-bundle_0twp6cz.js",
  "server/chunks/ssr/node_modules_0jkk2.o._.js",
  "server/chunks/ssr/[externals]__04yo14-._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/heic-convert/index.js [app-rsc] (ecmascript)");
    });
});
}),
"[externals]/sharp [external] (sharp, cjs, [project]/node_modules/sharp, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/[externals]_sharp_0ihk4u3._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/sharp [external] (sharp, cjs, [project]/node_modules/sharp)");
    });
});
}),
];
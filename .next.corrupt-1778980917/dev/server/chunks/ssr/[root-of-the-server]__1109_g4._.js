module.exports = [
"[externals]/node:crypto [external] (node:crypto, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/[externals]_node_crypto_0xdk2m3._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/node:crypto [external] (node:crypto, cjs)");
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
"[project]/node_modules/ffmpeg-static/index.js [app-rsc] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/[root-of-the-server]__033xhvf._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/ffmpeg-static/index.js [app-rsc] (ecmascript)");
    });
});
}),
];
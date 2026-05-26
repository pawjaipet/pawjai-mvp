module.exports = [
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
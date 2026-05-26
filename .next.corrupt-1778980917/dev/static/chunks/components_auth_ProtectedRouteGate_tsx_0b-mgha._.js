(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/auth/ProtectedRouteGate.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProtectedRouteGate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$AuthProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/auth/AuthProvider.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$account$2d$model$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/account-model.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ProtectedRouteGate({ nextPath, reason }) {
    _s();
    const { openAuthModal } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$AuthProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthModal"])();
    const safeNextPath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$account$2d$model$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNextPath"])(nextPath);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProtectedRouteGate.useEffect": ()=>{
            openAuthModal({
                nextPath: safeNextPath,
                reason
            });
        }
    }["ProtectedRouteGate.useEffect"], [
        openAuthModal,
        reason,
        safeNextPath
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex min-h-[calc(100vh-70px)] items-center justify-center px-[28px] text-center",
        style: {
            width: "402px",
            maxWidth: "100vw",
            margin: "0 auto"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[22px] font-bold text-[#65584f]",
                    children: "Sign in to continue"
                }, void 0, false, {
                    fileName: "[project]/components/auth/ProtectedRouteGate.tsx",
                    lineNumber: 26,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-[8px] text-[14px] text-[#65584f]/65",
                    children: reason
                }, void 0, false, {
                    fileName: "[project]/components/auth/ProtectedRouteGate.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: ()=>openAuthModal({
                            nextPath: safeNextPath,
                            reason
                        }),
                    className: "mt-[22px] rounded-full bg-[#cd8188] px-[28px] py-[12px] text-[15px] font-semibold text-white",
                    children: "Open sign in"
                }, void 0, false, {
                    fileName: "[project]/components/auth/ProtectedRouteGate.tsx",
                    lineNumber: 28,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/auth/ProtectedRouteGate.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/auth/ProtectedRouteGate.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
_s(ProtectedRouteGate, "SH2VQmqheGawZlzDNsD7SKyeNNM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$auth$2f$AuthProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthModal"]
    ];
});
_c = ProtectedRouteGate;
var _c;
__turbopack_context__.k.register(_c, "ProtectedRouteGate");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=components_auth_ProtectedRouteGate_tsx_0b-mgha._.js.map
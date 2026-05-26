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
"[project]/app/documents/data:e94e20 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "initialDocumentSubmissionState",
    ()=>$$RSC_SERVER_ACTION_1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"7f25d56bbce1192295104a6d12a11a8a695e9269bc":{"name":"initialDocumentSubmissionState"}},"app/documents/actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("7f25d56bbce1192295104a6d12a11a8a695e9269bc", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "initialDocumentSubmissionState");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/documents/data:e04f14 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "submitVerificationDocuments",
    ()=>$$RSC_SERVER_ACTION_0
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"60ff22a6e043471cc15bbfbe4c33e31f596acdee88":{"name":"submitVerificationDocuments"}},"app/documents/actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("60ff22a6e043471cc15bbfbe4c33e31f596acdee88", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "submitVerificationDocuments");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/utils/adopter-documents.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALLOWED_DOCUMENT_MIME_TYPES",
    ()=>ALLOWED_DOCUMENT_MIME_TYPES,
    "DOCUMENT_BUCKET",
    ()=>DOCUMENT_BUCKET,
    "MAX_DOCUMENT_BYTES",
    ()=>MAX_DOCUMENT_BYTES,
    "MAX_HOME_PHOTOS",
    ()=>MAX_HOME_PHOTOS,
    "collectHomePhotoFiles",
    ()=>collectHomePhotoFiles,
    "parseUploadedDocumentMetadata",
    ()=>parseUploadedDocumentMetadata,
    "setUploadedDocumentFields",
    ()=>setUploadedDocumentFields,
    "syncVerificationFileFields",
    ()=>syncVerificationFileFields
]);
const MAX_HOME_PHOTOS = 5;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const DOCUMENT_BUCKET = "adopter-documents";
const ALLOWED_DOCUMENT_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
];
const DOCUMENT_TYPES = new Set([
    "id_copy",
    "house_image",
    "income_statement",
    "other"
]);
function isPresentFile(value) {
    return value instanceof File && value.size > 0;
}
function syncVerificationFileFields(formData, { homePhotos, idFile }) {
    formData.delete("idFile");
    formData.delete("homePhotos");
    if (isPresentFile(idFile)) {
        formData.append("idFile", idFile);
    }
    for (const file of homePhotos){
        if (isPresentFile(file)) {
            formData.append("homePhotos", file);
        }
    }
    return formData;
}
function collectHomePhotoFiles(formData) {
    const files = formData.getAll("homePhotos").filter(isPresentFile);
    if (files.length > MAX_HOME_PHOTOS) {
        return {
            error: `Please upload no more than ${MAX_HOME_PHOTOS} home environment files.`,
            files: []
        };
    }
    return {
        error: null,
        files
    };
}
function isUploadedAdopterDocument(value) {
    if (!value || typeof value !== "object") return false;
    const record = value;
    return typeof record.documentType === "string" && DOCUMENT_TYPES.has(record.documentType) && typeof record.storagePath === "string" && record.storagePath.trim() !== "" && (typeof record.mimeType === "string" || record.mimeType === null) && (typeof record.originalFileName === "string" || record.originalFileName === null);
}
function setUploadedDocumentFields(formData, uploadedDocuments) {
    formData.delete("idFile");
    formData.delete("homePhotos");
    formData.delete("uploadedDocuments");
    if (uploadedDocuments.length > 0) {
        formData.set("uploadedDocuments", JSON.stringify(uploadedDocuments));
    }
    return formData;
}
function parseUploadedDocumentMetadata(formData) {
    const raw = String(formData.get("uploadedDocuments") ?? "").trim();
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isUploadedAdopterDocument) : [];
    } catch  {
        return [];
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/documents/DocumentsPageClient.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DocumentsPageClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$documents$2f$data$3a$e94e20__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/app/documents/data:e94e20 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$documents$2f$data$3a$e04f14__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/app/documents/data:e04f14 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/adopter-documents.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const M = "Montserrat, sans-serif";
const SECTIONS = [
    "A",
    "B",
    "C",
    "D"
];
const SECTION_META = {
    A: {
        label: "SECTION A: PERSONAL INFORMATION",
        title: "Personal Information",
        subtitle: "Please provide your personal details for verification purposes."
    },
    B: {
        label: "SECTION B: DOG OWNERSHIP EXPERIENCE",
        title: "Dog Ownership Experience",
        subtitle: "Tell us about your experience with dogs."
    },
    C: {
        label: "SECTION C: LIVING SITUATION",
        title: "Living Situation & Home Environment",
        subtitle: "Help us understand your living environment."
    },
    D: {
        label: "SECTION D: BONDING AND RESPONSIBILITY",
        title: "Bonding and Responsibility",
        subtitle: "Final section — your commitment to your future companion."
    }
};
function QuestionLabel({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "mb-[12px] text-[20px] font-bold leading-[1.25] text-[#65584f]",
        style: {
            fontFamily: M
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
_c = QuestionLabel;
const inputCls = "w-full rounded-[14px] border-0 bg-white px-[18px] py-[16px] text-[15px] text-[#65584f] outline-none placeholder:text-[#65584f]/35";
function ChoiceBtn({ selected, onClick, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: onClick,
        className: `w-full rounded-[14px] px-[20px] py-[16px] text-left text-[15px] font-medium transition-all active:scale-[0.98] ${selected ? "text-white" : "bg-white text-[#65584f]"}`,
        style: {
            background: selected ? "#cd8188" : "white",
            fontFamily: M
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_c1 = ChoiceBtn;
function Block({ question, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-[28px]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuestionLabel, {
                children: question
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
_c2 = Block;
function UploadBox({ existingLabel, file, label, name, onChange }) {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const currentLabel = file?.name ?? existingLabel ?? null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-[28px]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuestionLabel, {
                children: label
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>ref.current?.click(),
                className: "flex w-full flex-col items-center justify-center gap-[10px] rounded-[14px] bg-white py-[28px] transition-all active:scale-[0.98]",
                style: {
                    border: currentLabel ? "2px solid #cd8188" : "2px dashed rgba(101,88,79,0.2)"
                },
                children: currentLabel ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex h-[44px] w-[44px] items-center justify-center rounded-full",
                            style: {
                                background: "#cd8188"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "20",
                                height: "20",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "white",
                                strokeWidth: "2.5",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                    points: "20 6 9 17 4 12"
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 122,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 121,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 120,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[13px] font-semibold text-[#cd8188]",
                            style: {
                                fontFamily: M
                            },
                            children: currentLabel
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 125,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[11px] text-[#65584f]/40",
                            style: {
                                fontFamily: M
                            },
                            children: file ? "Tap to replace" : "Already uploaded · tap to replace"
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 126,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "22",
                            height: "22",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "#65584f",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            style: {
                                opacity: 0.4
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 133,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                    points: "17 8 12 3 7 8"
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 133,
                                    columnNumber: 69
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: "12",
                                    y1: "3",
                                    x2: "12",
                                    y2: "15"
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 133,
                                    columnNumber: 104
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 132,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[13px] font-semibold text-[#65584f]/50",
                            style: {
                                fontFamily: M
                            },
                            children: "Click to upload · JPG, PNG or PDF"
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 135,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ref: ref,
                name: name,
                type: "file",
                accept: "image/*,.pdf",
                className: "hidden",
                onChange: (e)=>{
                    if (e.target.files?.[0]) onChange(e.target.files[0]);
                }
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
_s(UploadBox, "QMBuJFIdzLIeqBcFwhMf246mjOM=");
_c3 = UploadBox;
function MultiUploadBox({ existingLabels, files, label, max, name, onChange }) {
    _s1();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const totalSelected = files.length;
    const remaining = Math.max(0, max - totalSelected);
    function removeFile(idx) {
        onChange(files.filter((_, i)=>i !== idx));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-[28px]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuestionLabel, {
                children: label
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 178,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mb-[10px] text-[13px] text-[#65584f]/55",
                style: {
                    fontFamily: M
                },
                children: [
                    "Up to ",
                    max,
                    " files · JPG, PNG, WEBP, or PDF"
                ]
            }, void 0, true, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 179,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-[10px]",
                children: [
                    files.map((file, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between gap-[12px] rounded-[14px] bg-white px-[18px] py-[14px]",
                            style: {
                                border: "2px solid #cd8188"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-[12px] min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full",
                                            style: {
                                                background: "#cd8188"
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "16",
                                                height: "16",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "white",
                                                strokeWidth: "2.5",
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                    points: "20 6 9 17 4 12"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                                    lineNumber: 192,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                                lineNumber: 191,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 190,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "truncate text-[13px] font-semibold text-[#cd8188]",
                                            style: {
                                                fontFamily: M
                                            },
                                            children: file.name
                                        }, void 0, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 195,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 189,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>removeFile(idx),
                                    className: "flex-shrink-0 rounded-full px-[10px] py-[4px] text-[11px] font-semibold",
                                    style: {
                                        background: "rgba(101,88,79,0.1)",
                                        color: "#65584f",
                                        fontFamily: M
                                    },
                                    children: "Remove"
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 197,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, `${file.name}-${idx}`, true, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 184,
                            columnNumber: 11
                        }, this)),
                    files.length === 0 && existingLabels.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-[14px] bg-white px-[18px] py-[12px]",
                        style: {
                            border: "2px solid rgba(205,129,136,0.4)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] uppercase tracking-widest text-[#65584f]/45 mb-[4px]",
                                style: {
                                    fontFamily: M
                                },
                                children: "Previously uploaded"
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 210,
                                columnNumber: 13
                            }, this),
                            existingLabels.map((name)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "truncate text-[13px] text-[#65584f]",
                                    style: {
                                        fontFamily: M
                                    },
                                    children: name
                                }, name, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 214,
                                    columnNumber: 15
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-[6px] text-[11px] text-[#65584f]/45",
                                style: {
                                    fontFamily: M
                                },
                                children: "Adding new files will replace these on submit."
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 216,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 209,
                        columnNumber: 11
                    }, this),
                    remaining > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>ref.current?.click(),
                        className: "flex w-full flex-col items-center justify-center gap-[8px] rounded-[14px] bg-white py-[24px] transition-all active:scale-[0.98]",
                        style: {
                            border: "2px dashed rgba(101,88,79,0.2)"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "22",
                                height: "22",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "#65584f",
                                strokeWidth: "2",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                style: {
                                    opacity: 0.4
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                    }, void 0, false, {
                                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                        lineNumber: 228,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                        points: "17 8 12 3 7 8"
                                    }, void 0, false, {
                                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                        lineNumber: 228,
                                        columnNumber: 69
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                        x1: "12",
                                        y1: "3",
                                        x2: "12",
                                        y2: "15"
                                    }, void 0, false, {
                                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                        lineNumber: 228,
                                        columnNumber: 104
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 227,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[13px] font-semibold text-[#65584f]/50",
                                style: {
                                    fontFamily: M
                                },
                                children: files.length === 0 ? existingLabels.length > 0 ? "Upload replacement files" : "Click to upload files" : `Add more (${remaining} left)`
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 230,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 221,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 182,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ref: ref,
                name: name,
                type: "file",
                accept: "image/*,.pdf",
                multiple: true,
                className: "hidden",
                onChange: (e)=>{
                    const picked = Array.from(e.target.files ?? []);
                    if (picked.length === 0) return;
                    const next = [
                        ...files,
                        ...picked
                    ].slice(0, max);
                    onChange(next);
                    // Allow re-picking same file later
                    if (ref.current) ref.current.value = "";
                }
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 240,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
        lineNumber: 177,
        columnNumber: 5
    }, this);
}
_s1(MultiUploadBox, "QMBuJFIdzLIeqBcFwhMf246mjOM=");
_c4 = MultiUploadBox;
function SectionWrapper({ active, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: active ? "block" : "hidden",
        children: children
    }, void 0, false, {
        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
        lineNumber: 261,
        columnNumber: 10
    }, this);
}
_c5 = SectionWrapper;
function statusCopy(status) {
    switch(status){
        case "approved":
            return "Approved";
        case "submitted":
            return "Submitted";
        case "needs_updates":
            return "Needs updates";
        default:
            return "Not started";
    }
}
function DocumentsPageClient({ initialData }) {
    _s2();
    const [section, setSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("A");
    const [state, formAction, isPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$documents$2f$data$3a$e04f14__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["submitVerificationDocuments"], __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$documents$2f$data$3a$e94e20__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["initialDocumentSubmissionState"]);
    const [isSubmittingFiles, startSubmitTransition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"])();
    const [a, setA] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        address: initialData.form.address,
        dateOfBirth: initialData.form.dateOfBirth,
        fullName: initialData.form.fullName,
        idFile: null,
        idNumber: initialData.form.idNumber,
        occupation: initialData.form.occupation,
        phone: initialData.form.phone
    });
    const [b, setB] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        hadPetsBefore: initialData.form.hadPetsBefore,
        petExperience: initialData.form.petExperience,
        reason: initialData.form.reason,
        rescueCareExp: initialData.form.rescueCareExp
    });
    const [c, setC] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        allergies: initialData.form.allergies,
        homePhotos: [],
        homeType: initialData.form.homeType,
        householdMembers: initialData.form.householdMembers,
        landlordPermission: initialData.form.landlordPermission,
        otherPets: initialData.form.otherPets,
        ownRent: initialData.form.ownRent,
        travelPlan: initialData.form.travelPlan,
        yardSpace: initialData.form.yardSpace
    });
    const [d, setD] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        agreement: initialData.form.agreement,
        behaviorResponse: initialData.form.behaviorResponse,
        bondingPlan: initialData.form.bondingPlan,
        emergency: initialData.form.emergency,
        financialReady: initialData.form.financialReady,
        patienceAwareness: initialData.form.patienceAwareness,
        timeAvailable: initialData.form.timeAvailable,
        traumaResponse: initialData.form.traumaResponse
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DocumentsPageClient.useEffect": ()=>{
            if (state.status === "success") {
                setSection("done");
            }
        }
    }["DocumentsPageClient.useEffect"], [
        state.status
    ]);
    const sectionIdx = section === "done" ? 4 : SECTIONS.indexOf(section);
    const meta = section !== "done" ? SECTION_META[section] : null;
    const PREV = {
        A: null,
        B: "A",
        C: "B",
        D: "C",
        done: "D"
    };
    const NEXT = {
        A: "B",
        B: "C",
        C: "D",
        D: "done"
    };
    const isSubmitting = isPending || isSubmittingFiles;
    const canContinue = section === "A" ? a.fullName.trim() !== "" : section === "B" ? b.hadPetsBefore !== "" : section === "C" ? c.homeType !== "" && c.ownRent !== "" : section === "D" ? d.agreement : false;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: (event)=>{
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncVerificationFileFields"])(formData, {
                homePhotos: c.homePhotos,
                idFile: a.idFile
            });
            startSubmitTransition(()=>{
                formAction(formData);
            });
        },
        className: "relative overflow-y-auto overflow-x-hidden",
        style: {
            width: "402px",
            maxWidth: "100vw",
            margin: "0 auto",
            minHeight: "100vh",
            paddingBottom: "100px",
            background: "#F5F1E8",
            scrollbarWidth: "none",
            fontFamily: M
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `div::-webkit-scrollbar{display:none}`
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 356,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-[16px] pt-[20px] pb-[8px]",
                children: section !== "done" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: "/profile",
                    className: "inline-flex items-center gap-[8px] rounded-full px-[16px] py-[10px] text-[13px] font-semibold text-white",
                    style: {
                        background: "#cd8188",
                        fontFamily: M
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "14",
                            height: "14",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "white",
                            strokeWidth: "2.5",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M19 12H5M5 12L12 19M5 12L12 5"
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 366,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 365,
                            columnNumber: 13
                        }, this),
                        "Save and Back to Profile"
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                    lineNumber: 360,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-[40px]"
                }, void 0, false, {
                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                    lineNumber: 371,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 358,
                columnNumber: 7
            }, this),
            section !== "done" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-[20px] pb-[8px]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-[12px] rounded-[16px] bg-white px-[16px] py-[14px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[11px] uppercase tracking-[0.18em] text-[#65584f]/45",
                            style: {
                                fontFamily: M
                            },
                            children: "Verification status"
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 378,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-[6px] text-[15px] font-semibold text-[#65584f]",
                            style: {
                                fontFamily: M
                            },
                            children: statusCopy(initialData.verificationStatus)
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 381,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-[4px] text-[12px] text-[#65584f]/60",
                            style: {
                                fontFamily: M
                            },
                            children: "Complete this once, then you can keep booking shelter visits without redoing the full document flow."
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 384,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                    lineNumber: 377,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 376,
                columnNumber: 9
            }, this),
            section !== "done" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center gap-[20px] py-[16px]",
                children: SECTIONS.map((s, i)=>{
                    const active = i === sectionIdx;
                    const done = i < sectionIdx;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center gap-[4px]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex h-[36px] w-[36px] items-center justify-center rounded-full text-[13px] font-bold transition-all",
                            style: {
                                background: active ? "#cd8188" : done ? "rgba(205,129,136,0.25)" : "rgba(101,88,79,0.12)",
                                color: active ? "white" : done ? "#cd8188" : "rgba(101,88,79,0.4)",
                                border: done ? "2px solid rgba(205,129,136,0.4)" : "2px solid transparent"
                            },
                            children: done ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "14",
                                height: "14",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "#cd8188",
                                strokeWidth: "2.5",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                    points: "20 6 9 17 4 12"
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 408,
                                    columnNumber: 23
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 407,
                                columnNumber: 21
                            }, this) : s
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 398,
                            columnNumber: 17
                        }, this)
                    }, s, false, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 397,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 392,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-[20px]",
                children: [
                    section !== "done" && meta && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-[20px] flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-bold uppercase tracking-widest text-[#65584f]/50",
                                style: {
                                    fontFamily: M
                                },
                                children: meta.label
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 421,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[12px] font-bold text-[#cd8188]",
                                style: {
                                    fontFamily: M
                                },
                                children: [
                                    sectionIdx + 1,
                                    "/4"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 422,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 420,
                        columnNumber: 11
                    }, this),
                    state.message && section !== "done" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `mb-[16px] rounded-[14px] px-[16px] py-[12px] text-[13px] ${state.status === "error" ? "bg-[#f6dadd] text-[#8f4d56]" : "bg-[#dcebd8] text-[#4d6b48]"}`,
                        style: {
                            fontFamily: M
                        },
                        children: state.message
                    }, void 0, false, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 427,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionWrapper, {
                        active: section === "A",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What is your full name?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "fullName",
                                    type: "text",
                                    className: inputCls,
                                    placeholder: "Type here",
                                    value: a.fullName,
                                    onChange: (e)=>setA({
                                            ...a,
                                            fullName: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 434,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 433,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What is your date of birth?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "dateOfBirth",
                                    type: "date",
                                    className: inputCls,
                                    value: a.dateOfBirth,
                                    onChange: (e)=>setA({
                                            ...a,
                                            dateOfBirth: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 437,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 436,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What is your ID or passport number?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "idNumber",
                                    type: "text",
                                    className: inputCls,
                                    placeholder: "Type here",
                                    value: a.idNumber,
                                    onChange: (e)=>setA({
                                            ...a,
                                            idNumber: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 440,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 439,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What is your home address?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    name: "address",
                                    rows: 3,
                                    className: `${inputCls} resize-none`,
                                    placeholder: "Type here",
                                    value: a.address,
                                    onChange: (e)=>setA({
                                            ...a,
                                            address: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 443,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 442,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What is your occupation?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "occupation",
                                    type: "text",
                                    className: inputCls,
                                    placeholder: "Type here",
                                    value: a.occupation,
                                    onChange: (e)=>setA({
                                            ...a,
                                            occupation: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 446,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 445,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What is your phone number?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "phone",
                                    type: "tel",
                                    className: inputCls,
                                    placeholder: "Type here",
                                    value: a.phone,
                                    onChange: (e)=>setA({
                                            ...a,
                                            phone: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 449,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 448,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UploadBox, {
                                existingLabel: initialData.existingIdFileName,
                                file: a.idFile,
                                label: "Upload your ID or passport",
                                name: "idFile",
                                onChange: (f)=>setA({
                                        ...a,
                                        idFile: f
                                    })
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 451,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 432,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionWrapper, {
                        active: section === "B",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "hadPetsBefore",
                                value: b.hadPetsBefore
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 455,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "rescueCareExp",
                                value: b.rescueCareExp
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 456,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Have you owned a dog before?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Yes",
                                        "No"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: b.hadPetsBefore === opt,
                                            onClick: ()=>setB({
                                                    ...b,
                                                    hadPetsBefore: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 460,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 458,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 457,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Have you ever cared for a rescue or stray dog before?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Yes",
                                        "No",
                                        "I have volunteered at a shelter"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: b.rescueCareExp === opt,
                                            onClick: ()=>setB({
                                                    ...b,
                                                    rescueCareExp: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 467,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 465,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 464,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Describe your experience with dogs",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    name: "petExperience",
                                    rows: 4,
                                    className: `${inputCls} resize-none`,
                                    placeholder: "Type here",
                                    value: b.petExperience,
                                    onChange: (e)=>setB({
                                            ...b,
                                            petExperience: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 472,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 471,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Why do you want to adopt a dog?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    name: "reason",
                                    rows: 4,
                                    className: `${inputCls} resize-none`,
                                    placeholder: "Type here",
                                    value: b.reason,
                                    onChange: (e)=>setB({
                                            ...b,
                                            reason: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 475,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 474,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 454,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionWrapper, {
                        active: section === "C",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "homeType",
                                value: c.homeType
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 480,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "ownRent",
                                value: c.ownRent
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 481,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "landlordPermission",
                                value: c.landlordPermission
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 482,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "otherPets",
                                value: JSON.stringify(c.otherPets)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 483,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "travelPlan",
                                value: c.travelPlan
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 484,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What type of home do you live in?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Apartment",
                                        "House",
                                        "Condo",
                                        "Other"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: c.homeType === opt,
                                            onClick: ()=>setC({
                                                    ...c,
                                                    homeType: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 488,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 486,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 485,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Do you own or rent?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Own",
                                        "Rent"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: c.ownRent === opt,
                                            onClick: ()=>setC({
                                                    ...c,
                                                    ownRent: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 495,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 493,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 492,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Do you have yard or outdoor space?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "yardSpace",
                                    type: "text",
                                    className: inputCls,
                                    placeholder: "Type here",
                                    value: c.yardSpace,
                                    onChange: (e)=>setC({
                                            ...c,
                                            yardSpace: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 500,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 499,
                                columnNumber: 11
                            }, this),
                            c.ownRent === "Rent" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Do you have landlord permission for pets?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Yes",
                                        "No",
                                        "Need to confirm"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: c.landlordPermission === opt,
                                            onClick: ()=>setC({
                                                    ...c,
                                                    landlordPermission: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 506,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 504,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 503,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "How many people live in your household?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "householdMembers",
                                    type: "number",
                                    min: "1",
                                    className: inputCls,
                                    placeholder: "Type here",
                                    value: c.householdMembers,
                                    onChange: (e)=>setC({
                                            ...c,
                                            householdMembers: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 512,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 511,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Are there any allergies in the household?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    name: "allergies",
                                    rows: 3,
                                    className: `${inputCls} resize-none`,
                                    placeholder: "Type here",
                                    value: c.allergies,
                                    onChange: (e)=>setC({
                                            ...c,
                                            allergies: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 515,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 514,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MultiUploadBox, {
                                existingLabels: initialData.existingHomeFileNames,
                                files: c.homePhotos,
                                label: "Upload clear photos of your home environment / pet designated areas",
                                max: __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAX_HOME_PHOTOS"],
                                name: "homePhotos",
                                onChange: (files)=>setC({
                                        ...c,
                                        homePhotos: files
                                    })
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 517,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Are there other pets in your home?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "None",
                                        "Dog(s)",
                                        "Cat(s)",
                                        "Other animals"
                                    ].map((opt)=>{
                                        const selected = c.otherPets.includes(opt);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: selected,
                                            onClick: ()=>setC({
                                                    ...c,
                                                    otherPets: selected ? c.otherPets.filter((x)=>x !== opt) : [
                                                        ...c.otherPets,
                                                        opt
                                                    ]
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 530,
                                            columnNumber: 19
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 526,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 525,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What will happen to your dog when you travel?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "I'll take them with me",
                                        "I have family / sitter support",
                                        "Pet hotel"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: c.travelPlan === opt,
                                            onClick: ()=>setC({
                                                    ...c,
                                                    travelPlan: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 549,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 547,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 546,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 479,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionWrapper, {
                        active: section === "D",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "bondingPlan",
                                value: JSON.stringify(d.bondingPlan)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 556,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "financialReady",
                                value: d.financialReady
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 557,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "patienceAwareness",
                                value: d.patienceAwareness
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 558,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "behaviorResponse",
                                value: d.behaviorResponse
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 559,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "traumaResponse",
                                value: d.traumaResponse
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 560,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "hidden",
                                name: "agreementAccepted",
                                value: String(d.agreement)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 561,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "How do you plan to bond with your new dog?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Regular walks and playtime",
                                        "Training and learning together",
                                        "Spending quality time at home"
                                    ].map((opt)=>{
                                        const selected = d.bondingPlan.includes(opt);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: selected,
                                            onClick: ()=>setD({
                                                    ...d,
                                                    bondingPlan: selected ? d.bondingPlan.filter((x)=>x !== opt) : [
                                                        ...d.bondingPlan,
                                                        opt
                                                    ]
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 567,
                                            columnNumber: 19
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 563,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 562,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "How much time can you dedicate to your dog daily?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "timeAvailable",
                                    type: "text",
                                    className: inputCls,
                                    placeholder: "eg. 2–3 hours for walks and play",
                                    value: d.timeAvailable,
                                    onChange: (e)=>setD({
                                            ...d,
                                            timeAvailable: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 584,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 583,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Are you financially prepared for pet ownership?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Yes, fully prepared",
                                        "Yes, with some budget planning",
                                        "Need more information"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: d.financialReady === opt,
                                            onClick: ()=>setD({
                                                    ...d,
                                                    financialReady: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 589,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 587,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 586,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "What will you do if you can't care for the dog anymore?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    name: "emergency",
                                    rows: 4,
                                    className: `${inputCls} resize-none`,
                                    placeholder: "Type here",
                                    value: d.emergency,
                                    onChange: (e)=>setD({
                                            ...d,
                                            emergency: e.target.value
                                        }),
                                    style: {
                                        fontFamily: M
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 594,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 593,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "Do you understand that some shelter dogs may need weeks or months to fully trust you and adjust?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Yes, I'm ready to be patient",
                                        "I understand, but I hope it doesn't take long",
                                        "I need more information",
                                        "I'm not sure"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: d.patienceAwareness === opt,
                                            onClick: ()=>setD({
                                                    ...d,
                                                    patienceAwareness: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 604,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 597,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 596,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "If your adopted dog chews shoes, furniture, or barks too much, how would you respond?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Use positive training and redirect behavior",
                                        "Give them more toys and attention",
                                        "Seek professional trainer help",
                                        "I don't know yet"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: d.behaviorResponse === opt,
                                            onClick: ()=>setD({
                                                    ...d,
                                                    behaviorResponse: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 616,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 609,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 608,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Block, {
                                question: "If the dog shows trauma-related behavior (fear, anxiety, aggression), how would you handle it?",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-[10px]",
                                    children: [
                                        "Work with a behaviorist or trainer",
                                        "Give them time and space to heal",
                                        "Learn about trauma recovery in dogs",
                                        "Seek advice from the shelter",
                                        "Be patient and consistent",
                                        "I'm not prepared for this"
                                    ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChoiceBtn, {
                                            selected: d.traumaResponse === opt,
                                            onClick: ()=>setD({
                                                    ...d,
                                                    traumaResponse: opt
                                                }),
                                            children: opt
                                        }, opt, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 630,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 621,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 620,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-[28px]",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "flex cursor-pointer items-start gap-[14px] rounded-[14px] bg-white px-[18px] py-[16px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            checked: d.agreement,
                                            onChange: (e)=>setD({
                                                    ...d,
                                                    agreement: e.target.checked
                                                }),
                                            className: "mt-[2px] h-[20px] w-[20px] shrink-0 rounded accent-[#cd8188]"
                                        }, void 0, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 636,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[14px] leading-[1.6] text-[#65584f]/70",
                                            style: {
                                                fontFamily: M
                                            },
                                            children: "I understand that adopting a dog is a long-term commitment and I am ready to provide a loving, safe, and caring home for the rest of their life."
                                        }, void 0, false, {
                                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                            lineNumber: 642,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 635,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 634,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 555,
                        columnNumber: 9
                    }, this),
                    section === "done" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center pb-[40px] pt-[40px] text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-[24px] flex h-[90px] w-[90px] items-center justify-center rounded-full",
                                style: {
                                    background: "#cd8188"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "40",
                                    height: "40",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "white",
                                    strokeWidth: "2.5",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                        points: "20 6 9 17 4 12"
                                    }, void 0, false, {
                                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                        lineNumber: 653,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 652,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 651,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-[12px] text-[28px] font-bold text-[#65584f]",
                                style: {
                                    fontFamily: M
                                },
                                children: "Verification Saved!"
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 656,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-[12px] max-w-[280px] text-[14px] text-[#65584f]/60",
                                style: {
                                    fontFamily: M
                                },
                                children: state.message ?? "Your verification details were saved successfully. You can update them later whenever something changes."
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 657,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/appointments",
                                className: "block w-full rounded-full py-[15px] text-center text-[16px] font-bold text-white transition-all active:scale-[0.98]",
                                style: {
                                    background: "#cd8188",
                                    fontFamily: M
                                },
                                children: "View Appointments"
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 660,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/dogs",
                                className: "mt-[14px] text-[14px] font-semibold text-[#65584f]/50",
                                style: {
                                    fontFamily: M
                                },
                                children: "Back to browsing"
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 667,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 650,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 418,
                columnNumber: 7
            }, this),
            section !== "done" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed bottom-[70px] flex items-center gap-[12px] px-[20px] pb-[16px] pt-[24px]",
                style: {
                    width: "402px",
                    maxWidth: "100vw",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(to top, #F5F1E8 60%, rgba(245,241,232,0) 100%)",
                    pointerEvents: "none"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>{
                            const prev = PREV[section];
                            if (prev) setSection(prev);
                        },
                        disabled: !PREV[section] || isSubmitting,
                        className: "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] transition-all active:scale-95 disabled:opacity-25",
                        style: {
                            border: "2px solid #65584f",
                            background: "transparent",
                            pointerEvents: "auto"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "14",
                            height: "14",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "#65584f",
                            strokeWidth: "2.5",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M19 12H5M5 12L12 19M5 12L12 5"
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 697,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                            lineNumber: 696,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 686,
                        columnNumber: 11
                    }, this),
                    section === "D" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        disabled: !canContinue || isSubmitting,
                        className: "flex h-[52px] flex-1 items-center justify-center gap-[8px] rounded-[14px] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-40",
                        style: {
                            background: canContinue ? "#65584f" : "rgba(101,88,79,0.18)",
                            color: canContinue ? "white" : "rgba(101,88,79,0.4)",
                            pointerEvents: "auto",
                            fontFamily: M
                        },
                        children: isSubmitting ? "Submitting..." : "Submit"
                    }, void 0, false, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 701,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        disabled: !canContinue || isSubmitting,
                        onClick: ()=>setSection(NEXT[section]),
                        className: "flex h-[52px] flex-1 items-center justify-center gap-[8px] rounded-[14px] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-40",
                        style: {
                            background: canContinue ? "#65584f" : "rgba(101,88,79,0.18)",
                            color: canContinue ? "white" : "rgba(101,88,79,0.4)",
                            pointerEvents: "auto",
                            fontFamily: M
                        },
                        children: [
                            "Continue",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "14",
                                height: "14",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "2.5",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M5 12h14M12 5l7 7-7 7"
                                }, void 0, false, {
                                    fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                    lineNumber: 729,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                                lineNumber: 728,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                        lineNumber: 715,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/documents/DocumentsPageClient.tsx",
                lineNumber: 675,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/documents/DocumentsPageClient.tsx",
        lineNumber: 341,
        columnNumber: 5
    }, this);
}
_s2(DocumentsPageClient, "tD3tC8p3SHpo9mwpQSYi2mA3u3I=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useActionState"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransition"]
    ];
});
_c6 = DocumentsPageClient;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "QuestionLabel");
__turbopack_context__.k.register(_c1, "ChoiceBtn");
__turbopack_context__.k.register(_c2, "Block");
__turbopack_context__.k.register(_c3, "UploadBox");
__turbopack_context__.k.register(_c4, "MultiUploadBox");
__turbopack_context__.k.register(_c5, "SectionWrapper");
__turbopack_context__.k.register(_c6, "DocumentsPageClient");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0of48f2._.js.map
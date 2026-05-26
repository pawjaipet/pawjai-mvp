module.exports = [
"[project]/utils/supabase/admin.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createAdminClient",
    ()=>createAdminClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-rsc] (ecmascript) <locals>");
;
;
function createAdminClient() {
    const supabaseUrl = ("TURBOPACK compile-time value", "https://bdnyvcvkyepipdcygkvn.supabase.co");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for internal admin actions.");
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
}),
"[project]/utils/adopter.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "canBookAppointment",
    ()=>canBookAppointment,
    "ensureAdopterForUser",
    ()=>ensureAdopterForUser,
    "getAdopterVerificationSnapshot",
    ()=>getAdopterVerificationSnapshot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/admin.ts [app-rsc] (ecmascript)");
;
function splitName(fullName) {
    const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? null;
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
    return {
        firstName,
        lastName
    };
}
async function ensureAdopterForUser(supabase, user) {
    const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
    const profilePictureUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
    const { data: profile, error: profileFindError } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (profileFindError) {
        throw new Error(profileFindError.message);
    }
    if (profile) {
        const profileUpdates = {};
        if (fullName) profileUpdates.full_name = fullName;
        if (profilePictureUrl) profileUpdates.profile_picture_url = profilePictureUrl;
        const { error: profileUpdateError } = Object.keys(profileUpdates).length ? await admin.from("profiles").update(profileUpdates).eq("id", user.id) : {
            error: null
        };
        if (profileUpdateError) {
            throw new Error(profileUpdateError.message);
        }
    } else {
        const { error: profileInsertError } = await admin.from("profiles").insert({
            full_name: fullName,
            id: user.id,
            profile_picture_url: profilePictureUrl,
            role: "adopter"
        });
        if (profileInsertError) {
            throw new Error(profileInsertError.message);
        }
    }
    const { data: existing, error: existingError } = await admin.from("adopters").select("*").eq("profile_id", user.id).maybeSingle();
    if (existingError) {
        throw new Error(existingError.message);
    }
    if (existing) return existing;
    const { firstName, lastName } = splitName(fullName);
    const { data: adopter, error } = await admin.from("adopters").insert({
        email: user.email ?? null,
        first_name: firstName,
        last_name: lastName,
        profile_id: user.id
    }).select("*").single();
    if (error) {
        throw new Error(error.message);
    }
    return adopter;
}
async function getAdopterVerificationSnapshot(supabase, user) {
    const adopter = await ensureAdopterForUser(supabase, user);
    const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const [{ data: profile }, { data: documents }] = await Promise.all([
        admin.from("adopter_profiles").select("*").eq("adopter_id", adopter.id).maybeSingle(),
        admin.from("adopter_documents").select("id, document_type, original_file_name, created_at").eq("adopter_id", adopter.id).order("created_at", {
            ascending: false
        })
    ]);
    return {
        adopter,
        documents: documents ?? [],
        profile: profile ?? null,
        status: adopter.verification_status
    };
}
function canBookAppointment(snapshot) {
    return (snapshot.status === "submitted" || snapshot.status === "approved") && Boolean(snapshot.profile?.completed_at);
}
}),
"[project]/utils/account-model.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AUTH_PROTECTED_PATH_PREFIXES",
    ()=>AUTH_PROTECTED_PATH_PREFIXES,
    "buildAuthPath",
    ()=>buildAuthPath,
    "formatAppointmentDateTime",
    ()=>formatAppointmentDateTime,
    "isAuthProtectedPath",
    ()=>isAuthProtectedPath,
    "optionalBoolean",
    ()=>optionalBoolean,
    "optionalString",
    ()=>optionalString,
    "parseAccountCredentials",
    ()=>parseAccountCredentials,
    "sanitizeNextPath",
    ()=>sanitizeNextPath
]);
function parseAccountCredentials(input) {
    const email = String(input.email ?? "").trim().toLowerCase();
    const password = String(input.password ?? "");
    const confirmPassword = input.confirmPassword == null ? null : String(input.confirmPassword);
    const fullName = String(input.fullName ?? "").trim() || null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
    }
    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
    }
    if (confirmPassword !== null && password !== confirmPassword) {
        throw new Error("Passwords do not match.");
    }
    return {
        email,
        password,
        fullName
    };
}
function optionalString(value) {
    const normalized = String(value ?? "").trim();
    return normalized || null;
}
function optionalBoolean(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
}
const AUTH_PROTECTED_PATH_PREFIXES = [
    "/appointments",
    "/documents",
    "/filter",
    "/messages",
    "/profile",
    "/schedule"
];
function isAuthProtectedPath(pathname) {
    const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return AUTH_PROTECTED_PATH_PREFIXES.some((prefix)=>{
        return normalized === prefix || normalized.startsWith(`${prefix}/`);
    });
}
function sanitizeNextPath(value) {
    const fallback = "/swipe";
    const candidate = String(value ?? "").trim();
    if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
        return fallback;
    }
    try {
        const parsed = new URL(candidate, "http://pawjai.local");
        if (parsed.origin !== "http://pawjai.local") {
            return fallback;
        }
        const pathWithQuery = `${parsed.pathname}${parsed.search}`;
        if (parsed.pathname === "/auth" || parsed.pathname.startsWith("/auth/")) {
            return fallback;
        }
        return pathWithQuery || fallback;
    } catch  {
        return fallback;
    }
}
function buildAuthPath({ nextPath, reason }) {
    const params = new URLSearchParams();
    params.set("next", sanitizeNextPath(nextPath));
    if (reason) {
        params.set("message", reason);
    }
    return `/auth?${params.toString()}`;
}
function formatAppointmentDateTime(date, time) {
    const [hour = "0", minute = "0"] = time.split(":");
    const appointment = new Date(`${date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`);
    const dateLabel = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium"
    }).format(appointment);
    const timeLabel = new Intl.DateTimeFormat("en-US", {
        timeStyle: "short"
    }).format(appointment);
    return `${dateLabel} at ${timeLabel}`;
}
}),
"[project]/utils/supabase/config.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSupabaseEnv",
    ()=>getSupabaseEnv
]);
function getSupabaseEnv() {
    const supabaseUrl = ("TURBOPACK compile-time value", "https://bdnyvcvkyepipdcygkvn.supabase.co");
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkbnl2Y3ZreWVwaXBkY3lna3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU0MjIsImV4cCI6MjA4MTgxMTQyMn0._wzMJLWnU7NX0gR8h6KB-1US5yvMR5_gE228tKRM_B4");
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Your project's URL and Key are required to create a Supabase client. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    return {
        supabaseKey,
        supabaseUrl
    };
}
}),
"[project]/utils/supabase/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/config.ts [app-rsc] (ecmascript)");
;
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const { supabaseKey, supabaseUrl } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSupabaseEnv"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(supabaseUrl, supabaseKey, {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {}
            }
        }
    });
}
}),
"[project]/app/auth/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00a60791e855f7701b5933463c777a5489ae0f55e9":{"name":"signOut"},"00b66fc88710294174bbe49d3599c867d17bcac44d":{"name":"ensureCurrentUserProfile"},"40003baec121f15e24ad638baf519a7e0b3f023af9":{"name":"signIn"},"400fa036006974acf46fa3e4fae9241a1bb4f7e706":{"name":"signUp"},"40903bbd12828539552264bd87ea2addd2e2ded4c3":{"name":"signInWithGoogle"}},"app/auth/actions.ts",""] */ __turbopack_context__.s([
    "ensureCurrentUserProfile",
    ()=>ensureCurrentUserProfile,
    "signIn",
    ()=>signIn,
    "signInWithGoogle",
    ()=>signInWithGoogle,
    "signOut",
    ()=>signOut,
    "signUp",
    ()=>signUp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/adopter.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$account$2d$model$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/account-model.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
function authRedirect(message, nextPath) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$account$2d$model$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["buildAuthPath"])({
        nextPath,
        reason: message
    }));
}
function getFormNext(formData) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$account$2d$model$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sanitizeNextPath"])(String(formData.get("next") ?? ""));
}
async function getRequestOrigin() {
    const requestHeaders = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["headers"])();
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
    return `${protocol}://${host}`;
}
async function signIn(formData) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const nextPath = getFormNext(formData);
    let credentials;
    try {
        credentials = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$account$2d$model$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseAccountCredentials"])({
            email: formData.get("email"),
            password: formData.get("password")
        });
    } catch (error) {
        authRedirect(error instanceof Error ? error.message : "Please check your details.", nextPath);
    }
    const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
    });
    if (error || !data.user) {
        authRedirect(error?.message ?? "We could not sign you in.", nextPath);
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureAdopterForUser"])(supabase, data.user);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/", "layout");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])(nextPath);
}
async function signUp(formData) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const nextPath = getFormNext(formData);
    let credentials;
    try {
        credentials = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$account$2d$model$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseAccountCredentials"])({
            email: formData.get("email"),
            password: formData.get("password"),
            confirmPassword: formData.get("confirmPassword")
        });
    } catch (error) {
        authRedirect(error instanceof Error ? error.message : "Please check your details.", nextPath);
    }
    const callbackUrl = new URL("/auth/callback", await getRequestOrigin());
    callbackUrl.searchParams.set("next", nextPath);
    const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
            data: {
                full_name: null
            },
            emailRedirectTo: callbackUrl.toString()
        }
    });
    if (error || !data.user) {
        authRedirect(error?.message ?? "We could not create your account.", nextPath);
    }
    if (data.session) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureAdopterForUser"])(supabase, data.user);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/", "layout");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])(nextPath);
    }
    authRedirect("Check your email to verify your account, then sign in.", nextPath);
}
async function signInWithGoogle(formData) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const nextPath = getFormNext(formData);
    const callbackUrl = new URL("/auth/callback", await getRequestOrigin());
    callbackUrl.searchParams.set("next", nextPath);
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: callbackUrl.toString()
        }
    });
    if (error || !data.url) {
        authRedirect(error?.message ?? "We could not start Google sign in.", nextPath);
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])(data.url);
}
async function ensureCurrentUserProfile() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            ok: false,
            error: "Please sign in again."
        };
    }
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureAdopterForUser"])(supabase, user);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/", "layout");
        return {
            ok: true
        };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : "We could not prepare your account."
        };
    }
}
async function signOut() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    await supabase.auth.signOut();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/", "layout");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/auth");
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    signIn,
    signUp,
    signInWithGoogle,
    ensureCurrentUserProfile,
    signOut
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signIn, "40003baec121f15e24ad638baf519a7e0b3f023af9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signUp, "400fa036006974acf46fa3e4fae9241a1bb4f7e706", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signInWithGoogle, "40903bbd12828539552264bd87ea2addd2e2ded4c3", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(ensureCurrentUserProfile, "00b66fc88710294174bbe49d3599c867d17bcac44d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(signOut, "00a60791e855f7701b5933463c777a5489ae0f55e9", null);
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/utils/adopter-documents.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
    "getDocumentExitSaveSummary",
    ()=>getDocumentExitSaveSummary,
    "getDocumentFileKind",
    ()=>getDocumentFileKind,
    "getStoredDocumentFileName",
    ()=>getStoredDocumentFileName,
    "getVerificationSaveMode",
    ()=>getVerificationSaveMode,
    "isHeicDocumentFile",
    ()=>isHeicDocumentFile,
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
    "image/heic",
    "image/heif",
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
const DOCUMENT_SECTIONS = [
    "A",
    "B",
    "C",
    "D"
];
const IMAGE_DOCUMENT_EXTENSIONS = new Set([
    "heic",
    "heif",
    "jpeg",
    "jpg",
    "png",
    "webp"
]);
const IMAGE_DOCUMENT_MIME_TYPES = new Set([
    "image/heic",
    "image/heif",
    "image/jpeg",
    "image/png",
    "image/webp"
]);
const VERIFICATION_SAVE_MODES = new Set([
    "draft",
    "submit"
]);
function isPresentFile(value) {
    return value instanceof File && value.size > 0;
}
function fileExtension(file) {
    const fromName = file.name.split(".").pop()?.toLowerCase();
    return fromName && /^[a-z0-9]{2,5}$/.test(fromName) ? fromName : "";
}
function fileBaseName(file) {
    return file.name.replace(/\.[^.]+$/, "") || "document";
}
function getDocumentFileKind(file) {
    const mimeType = file.type.toLowerCase();
    const extension = fileExtension(file);
    if (mimeType === "application/pdf" || extension === "pdf") return "pdf";
    if (IMAGE_DOCUMENT_MIME_TYPES.has(mimeType) || IMAGE_DOCUMENT_EXTENSIONS.has(extension)) return "image";
    return null;
}
function isHeicDocumentFile(file) {
    const mimeType = file.type.split(";")[0]?.trim().toLowerCase();
    const extension = fileExtension(file);
    return mimeType === "image/heic" || mimeType === "image/heif" || extension === "heic" || extension === "heif";
}
function getStoredDocumentFileName(file) {
    const kind = getDocumentFileKind(file);
    if (kind === "image") return `${fileBaseName(file)}.jpg`;
    if (kind === "pdf") return `${fileBaseName(file)}.pdf`;
    return file.name || "document";
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
function getVerificationSaveMode(formData) {
    const mode = String(formData.get("verificationSaveMode") ?? "submit");
    return VERIFICATION_SAVE_MODES.has(mode) ? mode : "submit";
}
function joinSectionNumbers(numbers) {
    if (numbers.length === 1) return String(numbers[0]);
    if (numbers.length === 2) return `${numbers[0]} and ${numbers[1]}`;
    return `${numbers.slice(0, -1).join(", ")}, and ${numbers.at(-1)}`;
}
function getDocumentExitSaveSummary(section) {
    const sectionIndex = DOCUMENT_SECTIONS.indexOf(section);
    if (sectionIndex <= 0) {
        return "No sections have been saved yet.";
    }
    const savedSections = Array.from({
        length: sectionIndex
    }, (_, index)=>index + 1);
    const savedCopy = savedSections.length === 1 ? `Section ${savedSections[0]} is` : `Sections ${joinSectionNumbers(savedSections)} are`;
    return `${savedCopy} already saved. Changes in section ${sectionIndex + 1} will not be saved until you press Continue.`;
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
}),
"[project]/app/documents/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"60ff22a6e043471cc15bbfbe4c33e31f596acdee88":{"name":"submitVerificationDocuments"}},"app/documents/actions.ts",""] */ __turbopack_context__.s([
    "submitVerificationDocuments",
    ()=>submitVerificationDocuments
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/adopter.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/adopter-documents.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
function parseBoolean(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
}
function parseNumber(value) {
    const normalized = String(value ?? "").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}
function parseString(value) {
    const normalized = String(value ?? "").trim();
    return normalized || null;
}
function parseJsonArray(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((item)=>String(item).trim()).filter(Boolean) : [];
    } catch  {
        return [];
    }
}
function splitName(fullName) {
    const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] ?? null,
        lastName: parts.length > 1 ? parts.slice(1).join(" ") : null
    };
}
async function convertHeicDocumentToJpeg(buffer) {
    try {
        const heicConvert = (await __turbopack_context__.A("[project]/node_modules/heic-convert/index.js [app-rsc] (ecmascript, async loader)")).default;
        const jpeg = await heicConvert({
            buffer: buffer,
            format: "JPEG",
            quality: 0.82
        });
        return Buffer.from(jpeg);
    } catch  {
        throw new Error("We couldn't convert that HEIC photo. Please export it as JPG or upload a different photo.");
    }
}
async function prepareDocumentUpload(file, kind) {
    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    if (kind === "pdf") {
        return {
            buffer: sourceBuffer,
            extension: "pdf",
            mimeType: "application/pdf",
            originalFileName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStoredDocumentFileName"])(file)
        };
    }
    const imageBuffer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isHeicDocumentFile"])(file) ? await convertHeicDocumentToJpeg(sourceBuffer) : sourceBuffer;
    try {
        const sharp = (await __turbopack_context__.A("[externals]/sharp [external] (sharp, cjs, [project]/node_modules/sharp, async loader)")).default;
        const buffer = await sharp(imageBuffer, {
            failOn: "none"
        }).rotate().resize({
            width: 2000,
            height: 2000,
            fit: "inside",
            withoutEnlargement: true
        }).jpeg({
            quality: 82,
            mozjpeg: true
        }).toBuffer();
        return {
            buffer,
            extension: "jpg",
            mimeType: "image/jpeg",
            originalFileName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStoredDocumentFileName"])(file)
        };
    } catch  {
        throw new Error("We couldn't process that image. Please upload a different photo or a PDF.");
    }
}
async function uploadDocumentFile({ adopterId, documentType, file, userId }) {
    const fileKind = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDocumentFileKind"])(file);
    if (!fileKind) {
        throw new Error("Only JPG, PNG, WEBP, HEIC, HEIF, or PDF files are supported.");
    }
    if (file.size <= 0 || file.size > __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MAX_DOCUMENT_BYTES"]) {
        throw new Error("Each document must be smaller than 15 MB.");
    }
    const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const preparedFile = await prepareDocumentUpload(file, fileKind);
    const { buffer } = preparedFile;
    const digest = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha1").update(buffer).digest("hex").slice(0, 10);
    const storagePath = `${userId}/${adopterId}/${documentType}-${Date.now()}-${digest}.${preparedFile.extension}`;
    const { error } = await admin.storage.from(__TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DOCUMENT_BUCKET"]).upload(storagePath, buffer, {
        contentType: preparedFile.mimeType,
        upsert: false
    });
    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
    return {
        mimeType: preparedFile.mimeType,
        originalFileName: preparedFile.originalFileName,
        storagePath
    };
}
async function submitVerificationDocuments(_prevState, formData) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            message: "Please sign in to submit your verification details.",
            status: "error"
        };
    }
    const adopter = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureAdopterForUser"])(supabase, user);
    const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const { data: existingDocuments } = await admin.from("adopter_documents").select("id, document_type").eq("adopter_id", adopter.id);
    const saveMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getVerificationSaveMode"])(formData);
    const isFinalSubmit = saveMode === "submit";
    const idFile = formData.get("idFile");
    const uploadedDocuments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseUploadedDocumentMetadata"])(formData).filter((document)=>document.storagePath.startsWith(`${user.id}/${adopter.id}/`));
    const uploadedIdDocuments = uploadedDocuments.filter((document)=>document.documentType === "id_copy");
    const uploadedHomeDocuments = uploadedDocuments.filter((document)=>document.documentType === "house_image");
    if (uploadedHomeDocuments.length > __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MAX_HOME_PHOTOS"]) {
        return {
            message: `Please upload no more than ${__TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MAX_HOME_PHOTOS"]} home environment files.`,
            status: "error"
        };
    }
    const homePhotoResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2d$documents$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["collectHomePhotoFiles"])(formData);
    if (homePhotoResult.error) {
        return {
            message: homePhotoResult.error,
            status: "error"
        };
    }
    const homePhotoFiles = homePhotoResult.files;
    const hasExistingId = (existingDocuments ?? []).some((doc)=>doc.document_type === "id_copy");
    const hasExistingHome = (existingDocuments ?? []).some((doc)=>doc.document_type === "house_image");
    if (isFinalSubmit && !(idFile instanceof File && idFile.size > 0) && uploadedIdDocuments.length === 0 && !hasExistingId) {
        return {
            message: "Please upload an ID or passport file.",
            status: "error"
        };
    }
    if (isFinalSubmit && homePhotoFiles.length === 0 && uploadedHomeDocuments.length === 0 && !hasExistingHome) {
        return {
            message: "Please upload at least one home environment photo or PDF.",
            status: "error"
        };
    }
    const fullName = parseString(formData.get("fullName"));
    const phoneNumber = parseString(formData.get("phone"));
    const address = parseString(formData.get("address"));
    const occupation = parseString(formData.get("occupation"));
    const dateOfBirth = parseString(formData.get("dateOfBirth"));
    const governmentIdNumber = parseString(formData.get("idNumber"));
    const hadPetsBeforeLabel = parseString(formData.get("hadPetsBefore"));
    const otherPets = parseJsonArray(formData.get("otherPets"));
    const bondingPlan = parseJsonArray(formData.get("bondingPlan"));
    const agreementAccepted = parseBoolean(formData.get("agreementAccepted")) === true;
    if (isFinalSubmit && !agreementAccepted) {
        return {
            message: "Please confirm the long-term commitment statement before submitting.",
            status: "error"
        };
    }
    const nextStatus = adopter.verification_status === "approved" ? "approved" : "submitted";
    const { firstName, lastName } = splitName(fullName);
    await admin.from("profiles").update({
        full_name: fullName,
        phone_number: phoneNumber
    }).eq("id", user.id);
    const adopterUpdates = {
        address_line: address,
        date_of_birth: dateOfBirth,
        email: user.email ?? adopter.email,
        first_name: firstName,
        government_id_number: governmentIdNumber,
        last_name: lastName,
        occupation,
        phone_number: phoneNumber
    };
    if (isFinalSubmit) {
        adopterUpdates.verification_status = nextStatus;
        adopterUpdates.verification_submitted_at = adopter.verification_submitted_at ?? new Date().toISOString();
    }
    await admin.from("adopters").update(adopterUpdates).eq("id", adopter.id);
    const profilePayload = {
        adopter_id: adopter.id,
        adoption_reason: parseString(formData.get("reason")),
        agreement_accepted: agreementAccepted,
        behavior_response: parseString(formData.get("behaviorResponse")),
        bonding_plan: bondingPlan,
        current_pets: null,
        daily_time_available: parseString(formData.get("timeAvailable")),
        dog_experience: parseString(formData.get("petExperience")),
        emergency_plan: parseString(formData.get("emergency")),
        financial_preparedness: parseString(formData.get("financialReady")),
        had_pets_before: hadPetsBeforeLabel === "Yes" ? true : hadPetsBeforeLabel === "No" ? false : null,
        home_ownership: parseString(formData.get("ownRent")),
        household_allergies: parseString(formData.get("allergies")),
        household_member_count: parseNumber(formData.get("householdMembers")),
        housing_type: parseString(formData.get("homeType")),
        landlord_permission: parseString(formData.get("landlordPermission")),
        other_pets: otherPets,
        patience_awareness: parseString(formData.get("patienceAwareness")),
        rescue_dog_experience: parseString(formData.get("rescueCareExp")),
        trauma_response: parseString(formData.get("traumaResponse")),
        travel_plan: parseString(formData.get("travelPlan")),
        yard_space: parseString(formData.get("yardSpace"))
    };
    if (isFinalSubmit) {
        profilePayload.completed_at = new Date().toISOString();
    }
    const { error: profileError } = await admin.from("adopter_profiles").upsert(profilePayload);
    if (profileError) {
        return {
            message: profileError.message,
            status: "error"
        };
    }
    const documentRows = [];
    try {
        if (uploadedIdDocuments.length > 0) {
            await admin.from("adopter_documents").delete().eq("adopter_id", adopter.id).eq("document_type", "id_copy");
            const uploaded = uploadedIdDocuments.at(-1);
            documentRows.push({
                adopter_id: adopter.id,
                document_type: "id_copy",
                mime_type: uploaded.mimeType,
                original_file_name: uploaded.originalFileName,
                storage_path: uploaded.storagePath
            });
        }
        if (uploadedHomeDocuments.length > 0) {
            await admin.from("adopter_documents").delete().eq("adopter_id", adopter.id).eq("document_type", "house_image");
            for (const uploaded of uploadedHomeDocuments){
                documentRows.push({
                    adopter_id: adopter.id,
                    document_type: "house_image",
                    mime_type: uploaded.mimeType,
                    original_file_name: uploaded.originalFileName,
                    storage_path: uploaded.storagePath
                });
            }
        }
        if (uploadedIdDocuments.length === 0 && idFile instanceof File && idFile.size > 0) {
            const uploaded = await uploadDocumentFile({
                adopterId: adopter.id,
                documentType: "id_copy",
                file: idFile,
                userId: user.id
            });
            await admin.from("adopter_documents").delete().eq("adopter_id", adopter.id).eq("document_type", "id_copy");
            documentRows.push({
                adopter_id: adopter.id,
                document_type: "id_copy",
                mime_type: uploaded.mimeType,
                original_file_name: uploaded.originalFileName,
                storage_path: uploaded.storagePath
            });
        }
        if (homePhotoFiles.length > 0 && uploadedHomeDocuments.length === 0) {
            const uploadedHomePhotos = [];
            for (const file of homePhotoFiles){
                const uploaded = await uploadDocumentFile({
                    adopterId: adopter.id,
                    documentType: "house_image",
                    file,
                    userId: user.id
                });
                uploadedHomePhotos.push(uploaded);
            }
            // Replace prior set with new set
            await admin.from("adopter_documents").delete().eq("adopter_id", adopter.id).eq("document_type", "house_image");
            for (const uploaded of uploadedHomePhotos){
                documentRows.push({
                    adopter_id: adopter.id,
                    document_type: "house_image",
                    mime_type: uploaded.mimeType,
                    original_file_name: uploaded.originalFileName,
                    storage_path: uploaded.storagePath
                });
            }
        }
    } catch (error) {
        return {
            message: error instanceof Error ? error.message : "Document upload failed.",
            status: "error"
        };
    }
    if (documentRows.length > 0) {
        const { error: documentError } = await admin.from("adopter_documents").insert(documentRows);
        if (documentError) {
            return {
                message: documentError.message,
                status: "error"
            };
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/appointments");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/documents");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/dogs`);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/profile");
    return {
        completed: isFinalSubmit,
        message: isFinalSubmit ? nextStatus === "approved" ? "Your verification details were updated successfully." : "Your verification details were submitted successfully." : "Your progress was saved.",
        status: "success"
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    submitVerificationDocuments
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(submitVerificationDocuments, "60ff22a6e043471cc15bbfbe4c33e31f596acdee88", null);
}),
"[project]/.next-internal/server/app/documents/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/app/documents/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$documents$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/documents/actions.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/.next-internal/server/app/documents/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/app/documents/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00b66fc88710294174bbe49d3599c867d17bcac44d",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureCurrentUserProfile"],
    "60ff22a6e043471cc15bbfbe4c33e31f596acdee88",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$documents$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["submitVerificationDocuments"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$documents$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$app$2f$documents$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/documents/page/actions.js { ACTIONS_MODULE0 => "[project]/app/auth/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/app/documents/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$documents$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/documents/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0q4_u_3._.js.map
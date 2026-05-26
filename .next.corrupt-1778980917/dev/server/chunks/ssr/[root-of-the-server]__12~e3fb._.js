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
"[externals]/node:child_process [external] (node:child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:child_process", () => require("node:child_process"));

module.exports = mod;
}),
"[externals]/node:fs/promises [external] (node:fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs/promises", () => require("node:fs/promises"));

module.exports = mod;
}),
"[externals]/node:os [external] (node:os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:os", () => require("node:os"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:util [external] (node:util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:util", () => require("node:util"));

module.exports = mod;
}),
"[project]/utils/admin-auth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ADMIN_GATE_COOKIE",
    ()=>ADMIN_GATE_COOKIE,
    "closeAdminGate",
    ()=>closeAdminGate,
    "isAdminGateOpen",
    ()=>isAdminGateOpen,
    "openAdminGate",
    ()=>openAdminGate,
    "validateAdminPassphrase",
    ()=>validateAdminPassphrase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
const ADMIN_GATE_COOKIE = "pawjai_admin_gate";
const DEFAULT_ADMIN_PASSPHRASE = "pawjaiadmin";
function getAdminPassphrase() {
    return process.env.PAWJAI_ADMIN_PASSPHRASE ?? DEFAULT_ADMIN_PASSPHRASE;
}
async function isAdminGateOpen() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const gate = cookieStore.get(ADMIN_GATE_COOKIE)?.value;
    return gate === getAdminPassphrase();
}
async function openAdminGate() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(ADMIN_GATE_COOKIE, getAdminPassphrase(), {
        httpOnly: true,
        maxAge: 60 * 60 * 12,
        path: "/",
        sameSite: "lax",
        secure: ("TURBOPACK compile-time value", "development") === "production"
    });
}
async function closeAdminGate() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.delete(ADMIN_GATE_COOKIE);
}
function validateAdminPassphrase(value) {
    return value.trim() === getAdminPassphrase();
}
}),
"[project]/utils/backblaze.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildBackblazePublicUrl",
    ()=>buildBackblazePublicUrl,
    "extensionFromContentType",
    ()=>extensionFromContentType,
    "uploadBufferToBackblaze",
    ()=>uploadBufferToBackblaze
]);
;
const DEFAULT_B2_PUBLIC_BASE_URL = "https://f006.backblazeb2.com/file/pawjai";
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required Backblaze environment variable: ${name}`);
    }
    return value;
}
function getPublicBaseUrl() {
    return (process.env.PAWJAI_B2_PUBLIC_BASE_URL ?? DEFAULT_B2_PUBLIC_BASE_URL).replace(/\/+$/, "");
}
function extensionFromContentType(contentType) {
    const type = contentType?.split(";")[0]?.trim().toLowerCase();
    switch(type){
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        case "image/gif":
            return "gif";
        case "image/avif":
            return "avif";
        default:
            return "bin";
    }
}
function buildBackblazePublicUrl(storagePath) {
    return `${getPublicBaseUrl()}/${storagePath}`;
}
async function authorizeBackblaze() {
    const keyId = requireEnv("B2_KEY_ID");
    const applicationKey = requireEnv("B2_APPLICATION_KEY");
    const response = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
        headers: {
            Authorization: `Basic ${Buffer.from(`${keyId}:${applicationKey}`).toString("base64")}`
        },
        method: "GET"
    });
    if (!response.ok) {
        throw new Error(`Backblaze authorization failed with status ${response.status}.`);
    }
    return await response.json();
}
async function getUploadUrl(auth, bucketId) {
    const apiUrl = auth.apiInfo?.storageApi?.apiUrl ?? auth.apiUrl;
    if (!apiUrl) {
        throw new Error("Backblaze authorization did not return an API URL.");
    }
    const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
        body: JSON.stringify({
            bucketId
        }),
        headers: {
            Authorization: auth.authorizationToken,
            "Content-Type": "application/json"
        },
        method: "POST"
    });
    if (!response.ok) {
        throw new Error(`Backblaze upload URL request failed with status ${response.status}.`);
    }
    return await response.json();
}
async function sha1Hex(buffer) {
    const { createHash } = await __turbopack_context__.A("[externals]/node:crypto [external] (node:crypto, cjs, async loader)");
    return createHash("sha1").update(buffer).digest("hex");
}
async function uploadBufferToBackblaze({ body, contentType, desiredPath }) {
    const bucketId = requireEnv("B2_BUCKET_ID");
    const auth = await authorizeBackblaze();
    const upload = await getUploadUrl(auth, bucketId);
    const fileName = desiredPath.replace(/^\/+/, "");
    const checksum = await sha1Hex(body);
    const resolvedContentType = contentType?.split(";")[0]?.trim() || "b2/x-auto";
    const response = await fetch(upload.uploadUrl, {
        body: new Uint8Array(body),
        headers: {
            Authorization: upload.authorizationToken,
            "Content-Length": String(body.byteLength),
            "Content-Type": resolvedContentType,
            "X-Bz-Content-Sha1": checksum,
            "X-Bz-File-Name": encodeURIComponent(fileName)
        },
        method: "POST"
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backblaze upload failed with status ${response.status}: ${errorText}`);
    }
    return {
        contentType: resolvedContentType,
        extension: extensionFromContentType(contentType),
        publicUrl: buildBackblazePublicUrl(fileName),
        storagePath: fileName
    };
}
}),
"[project]/utils/onedrive.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchRemoteAsset",
    ()=>fetchRemoteAsset
]);
;
function toBase64Url(value) {
    return Buffer.from(value).toString("base64").replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/g, "");
}
function isOneDriveUrl(url) {
    return url.hostname.includes("1drv.ms") || url.hostname.includes("onedrive.live.com") || url.hostname.includes("sharepoint.com");
}
async function fetchRemoteAsset(sourceUrl) {
    const parsed = new URL(sourceUrl);
    if (isOneDriveUrl(parsed)) {
        const shareId = `u!${toBase64Url(sourceUrl)}`;
        const directUrl = `https://api.onedrive.com/v1.0/shares/${shareId}/root/content`;
        const response = await fetch(directUrl, {
            method: "GET",
            redirect: "follow"
        });
        if (!response.ok) {
            throw new Error(`OneDrive download failed with status ${response.status}.`);
        }
        return response;
    }
    const response = await fetch(sourceUrl, {
        method: "GET",
        redirect: "follow"
    });
    if (!response.ok) {
        throw new Error(`Image download failed with status ${response.status}.`);
    }
    return response;
}
}),
"[project]/utils/slug.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "slugify",
    ()=>slugify
]);
function slugify(value) {
    return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
}),
"[project]/app/admin/dogs/new/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"0040adac30c0e2d1b1a29743ab15ced00a356a91ba":{"name":"lockAdminGateAction"},"60a6b10d2d51f45ef8bbf3f96964d71c04f8a40dec":{"name":"createDogListingAction"},"60fabb839836a79cc29a1b0f6da2316e534ee0e2a3":{"name":"unlockAdminGateAction"}},"app/admin/dogs/new/actions.ts",""] */ __turbopack_context__.s([
    "createDogListingAction",
    ()=>createDogListingAction,
    "lockAdminGateAction",
    ()=>lockAdminGateAction,
    "unlockAdminGateAction",
    ()=>unlockAdminGateAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$child_process__$5b$external$5d$__$28$node$3a$child_process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:child_process [external] (node:child_process, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:os [external] (node:os, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$util__$5b$external$5d$__$28$node$3a$util$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:util [external] (node:util, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$admin$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/admin-auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$backblaze$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/backblaze.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$onedrive$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/onedrive.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$slug$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/slug.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
const DOG_GENDERS = new Set([
    "female",
    "male",
    "unknown"
]);
const DOG_SIZES = new Set([
    "small",
    "medium",
    "large",
    "extra_large"
]);
const DOG_ENERGY_LEVELS = new Set([
    "low",
    "medium",
    "high"
]);
const DOG_ADOPTION_STATUSES = new Set([
    "draft",
    "available",
    "reserved",
    "adopted",
    "unavailable"
]);
const IMAGE_EXTENSIONS = new Set([
    ".avif",
    ".gif",
    ".heic",
    ".heif",
    ".jpeg",
    ".jpg",
    ".png",
    ".webp"
]);
const DOG_PHOTOS_BUCKET = "dog-photos";
const DOG_MEDIA_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "video/mp4"
];
const DOG_STORAGE_IMAGE_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp"
]);
const MAX_DOG_PHOTO_WIDTH = 1800;
const MAX_DOG_PHOTO_HEIGHT = 2400;
const DOG_PHOTO_JPEG_QUALITY = 78;
const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;
const DOG_VIDEO_DURATION_SECONDS = 10;
const execFileAsync = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$util__$5b$external$5d$__$28$node$3a$util$2c$__cjs$29$__["promisify"])(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$child_process__$5b$external$5d$__$28$node$3a$child_process$2c$__cjs$29$__["execFile"]);
function getString(formData, name) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
}
function getOptionalString(formData, name) {
    const value = getString(formData, name);
    return value.length > 0 ? value : null;
}
function getStringValues(formData, name) {
    return formData.getAll(name).map((value)=>typeof value === "string" ? value.trim() : "").filter(Boolean);
}
function getOptionalNumber(formData, name) {
    const value = getString(formData, name);
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
}
function getBoolean(formData, name) {
    return formData.get(name) === "on";
}
function getOptionalBooleanValue(formData, name) {
    const value = getString(formData, name);
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
}
function getEnumValue(formData, name, allowed, fallback) {
    const value = getString(formData, name);
    if (allowed.has(value)) {
        return value;
    }
    return fallback ?? null;
}
function extensionFromContentType(contentType) {
    const type = contentType?.split(";")[0]?.trim().toLowerCase();
    switch(type){
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        case "image/gif":
            return "gif";
        case "image/avif":
            return "avif";
        case "image/heic":
            return "heic";
        case "image/heif":
            return "heif";
        default:
            return "bin";
    }
}
function isHeicImage(contentType, extension) {
    const normalizedType = contentType?.split(";")[0]?.trim().toLowerCase();
    const normalizedExtension = extension?.replace(/^\./, "").toLowerCase();
    return normalizedType === "image/heic" || normalizedType === "image/heif" || normalizedExtension === "heic" || normalizedExtension === "heif";
}
async function convertHeicToJpeg(body) {
    try {
        const heicConvert = (await __turbopack_context__.A("[project]/node_modules/heic-convert/index.js [app-rsc] (ecmascript, async loader)")).default;
        const jpeg = await heicConvert({
            buffer: body,
            format: "JPEG",
            quality: DOG_PHOTO_JPEG_QUALITY / 100
        });
        return Buffer.from(jpeg);
    } catch (heicConvertError) {
        const tempDir = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdtemp(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__["default"].tmpdir(), "pawjai-heic-"));
        const inputPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(tempDir, "input.heic");
        const outputPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(tempDir, "output.jpg");
        try {
            await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(inputPath, body);
            await execFileAsync("/usr/bin/sips", [
                "-s",
                "format",
                "jpeg",
                inputPath,
                "--out",
                outputPath
            ]);
            return await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].readFile(outputPath);
        } catch  {
            throw new Error(`This HEIC photo could not be converted to JPG. Please try a different export of the same photo. ${heicConvertError instanceof Error ? heicConvertError.message : ""}`);
        } finally{
            await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].rm(tempDir, {
                force: true,
                recursive: true
            });
        }
    }
}
async function optimizeDogPhoto({ body, contentType, extension }) {
    const isHeic = isHeicImage(contentType, extension);
    const sourceBody = isHeic ? await convertHeicToJpeg(body) : body;
    const sourceContentType = isHeic ? "image/jpeg" : contentType;
    const sourceExtension = isHeic ? "jpg" : extension;
    try {
        const { default: sharp } = await __turbopack_context__.A("[externals]/sharp [external] (sharp, cjs, [project]/node_modules/sharp, async loader)");
        const optimizedBody = await sharp(sourceBody, {
            failOn: "none"
        }).rotate().resize({
            fit: "inside",
            height: MAX_DOG_PHOTO_HEIGHT,
            width: MAX_DOG_PHOTO_WIDTH,
            withoutEnlargement: true
        }).jpeg({
            mozjpeg: true,
            quality: DOG_PHOTO_JPEG_QUALITY
        }).toBuffer();
        return {
            body: optimizedBody,
            contentType: "image/jpeg",
            extension: "jpg"
        };
    } catch  {
        const fallbackContentType = sourceContentType?.split(";")[0]?.trim() || "application/octet-stream";
        if (!DOG_STORAGE_IMAGE_MIME_TYPES.has(fallbackContentType)) {
            throw new Error("This image format could not be converted to JPG. Please upload a JPG, PNG, or WEBP image instead.");
        }
        return {
            body: sourceBody,
            contentType: fallbackContentType,
            extension: sourceExtension?.replace(/^\./, "") || extensionFromContentType(sourceContentType)
        };
    }
}
function isHeicFile(file) {
    const normalizedType = file.type.split(";")[0]?.trim().toLowerCase();
    const normalizedName = file.name.toLowerCase();
    return normalizedType === "image/heic" || normalizedType === "image/heif" || normalizedName.endsWith(".heic") || normalizedName.endsWith(".heif");
}
function normalizePhotoUrls(formData) {
    return formData.getAll("photo_url").map((value)=>typeof value === "string" ? value.trim() : "").filter(Boolean);
}
function normalizeTraitPairs(formData) {
    const types = formData.getAll("trait_type").map((value)=>typeof value === "string" ? value.trim() : "");
    const values = formData.getAll("trait_value").map((value)=>typeof value === "string" ? value.trim() : "");
    const rows = [];
    for(let index = 0; index < Math.max(types.length, values.length); index += 1){
        const traitType = types[index] ?? "";
        const traitValue = values[index] ?? "";
        if (!traitType && !traitValue) continue;
        rows.push({
            traitType,
            traitValue
        });
    }
    return rows;
}
function normalizeStructuredTraits(formData) {
    const traits = [
        [
            "training_preference_match",
            getOptionalString(formData, "training_preference_match")
        ],
        [
            "people_friendliness",
            getOptionalString(formData, "people_friendliness")
        ],
        [
            "dog_social_style",
            getOptionalString(formData, "dog_social_style")
        ],
        [
            "intake_note",
            getOptionalString(formData, "intake_note")
        ]
    ];
    const structuredTraits = traits.filter(([, traitValue])=>Boolean(traitValue)).map(([traitType, traitValue])=>({
            traitType: traitType,
            traitValue: traitValue
        }));
    const personalityTraits = getStringValues(formData, "personality_tag").map((traitValue)=>({
            traitType: "personality",
            traitValue
        }));
    const customPersonalityTraits = getStringValues(formData, "custom_personality_tags").flatMap((traitValue)=>traitValue.split(/[\n,]+/)).map((traitValue)=>traitValue.trim()).filter(Boolean).map((traitValue)=>({
            traitType: "personality",
            traitValue
        }));
    const careTraits = getStringValues(formData, "care_tag").filter((traitValue)=>traitValue !== "No medical needs").map((traitValue)=>({
            traitType: "medical_needs",
            traitValue
        }));
    return [
        ...structuredTraits,
        ...personalityTraits,
        ...customPersonalityTraits,
        ...careTraits
    ];
}
function guessExtensionFromUrl(url) {
    try {
        const pathname = new URL(url).pathname;
        const match = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
        return match?.[1]?.toLowerCase() ?? null;
    } catch  {
        return null;
    }
}
function guessExtensionFromFileName(fileName) {
    const extension = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(fileName).replace(/^\./, "").toLowerCase();
    return extension || null;
}
function photoLetter(photoIndex) {
    let index = photoIndex;
    let label = "";
    do {
        label = String.fromCharCode(97 + index % 26) + label;
        index = Math.floor(index / 26) - 1;
    }while (index >= 0)
    return label;
}
function buildDogPhotoPath({ dogName, dogNumber, extension, photoIndex }) {
    const slug = buildDogMediaBaseName(dogName, dogNumber);
    const normalizedExtension = extension?.replace(/^\./, "") || "jpg";
    return `pawjaidogs/${slug}-photo${photoLetter(photoIndex)}.${normalizedExtension}`;
}
function buildDogVideoPath({ dogName, dogNumber }) {
    const slug = buildDogMediaBaseName(dogName, dogNumber);
    return `pawjaidogs/${slug}-video.mp4`;
}
function buildDogMediaBaseName(dogName, dogNumber) {
    const fullNameSlug = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$slug$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["slugify"])(dogName);
    if (fullNameSlug) return `${fullNameSlug}-dog${dogNumber}`;
    const romanizedAlias = dogName.match(/\(([^)]+)\)/)?.[1];
    const aliasSlug = romanizedAlias ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$slug$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["slugify"])(romanizedAlias) : "";
    if (aliasSlug) return `${aliasSlug}-dog${dogNumber}`;
    return `dog-${dogNumber}`;
}
async function getNextDogNumber(supabase) {
    const { count, error } = await supabase.from("dogs").select("id", {
        count: "exact",
        head: true
    });
    if (error) {
        return Date.now();
    }
    return (count ?? 0) + 1;
}
async function uploadPhotoFromSourceUrl({ dogName, dogNumber, photoIndex, sourceUrl, supabase }) {
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$onedrive$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchRemoteAsset"])(sourceUrl);
    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
        throw new Error(`Photo ${photoIndex + 1} did not resolve to an image file. Received ${contentType ?? "unknown content type"}.`);
    }
    const extension = guessExtensionFromUrl(sourceUrl) ?? extensionFromContentType(contentType);
    return uploadPhotoBuffer({
        body: Buffer.from(await response.arrayBuffer()),
        contentType,
        dogName,
        dogNumber,
        extension,
        photoIndex,
        supabase
    });
}
async function uploadPhotoBuffer({ body, contentType, dogName, dogNumber, extension, photoIndex, supabase }) {
    const optimizedPhoto = await optimizeDogPhoto({
        body,
        contentType,
        extension
    });
    const desiredPath = buildDogPhotoPath({
        dogName,
        dogNumber,
        extension: optimizedPhoto.extension,
        photoIndex
    });
    const { error: uploadError } = await supabase.storage.from(DOG_PHOTOS_BUCKET).upload(desiredPath, optimizedPhoto.body, {
        contentType: optimizedPhoto.contentType,
        upsert: true
    });
    if (uploadError) {
        throw new Error(`Supabase photo upload failed: ${uploadError.message}`);
    }
    const { data } = supabase.storage.from(DOG_PHOTOS_BUCKET).getPublicUrl(desiredPath);
    let backblazeMirrorError;
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$backblaze$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uploadBufferToBackblaze"])({
            body: optimizedPhoto.body,
            contentType: optimizedPhoto.contentType,
            desiredPath
        });
    } catch (error) {
        backblazeMirrorError = error instanceof Error ? error.message : "Unknown Backblaze mirror error";
    }
    return {
        backblazeMirrorError,
        publicUrl: data.publicUrl,
        storagePath: desiredPath
    };
}
async function optimizeDogVideo(body, contentType) {
    const tempDir = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdtemp(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__["default"].tmpdir(), "pawjai-video-"));
    const inputPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(tempDir, "input");
    const outputPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(tempDir, "output.mp4");
    try {
        const ffmpegModule = await __turbopack_context__.A("[project]/node_modules/ffmpeg-static/index.js [app-rsc] (ecmascript, async loader)");
        const ffmpegPath = ffmpegModule.default;
        if (!ffmpegPath) {
            if (contentType === "video/mp4") return body;
            throw new Error("Video compression is unavailable on this machine.");
        }
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(inputPath, body);
        await execFileAsync(ffmpegPath, [
            "-y",
            "-i",
            inputPath,
            "-t",
            String(DOG_VIDEO_DURATION_SECONDS),
            "-an",
            "-vf",
            "scale='if(gt(iw,ih),720,-2)':'if(gt(iw,ih),-2,720)'",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "28",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            outputPath
        ]);
        return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].readFile(outputPath);
    } finally{
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].rm(tempDir, {
            force: true,
            recursive: true
        });
    }
}
async function uploadVideoFile({ dogName, dogNumber, file, supabase }) {
    const body = Buffer.from(await file.arrayBuffer());
    const optimizedBody = await optimizeDogVideo(body, file.type || null);
    const desiredPath = buildDogVideoPath({
        dogName,
        dogNumber
    });
    const { error: bucketError } = await supabase.storage.updateBucket(DOG_PHOTOS_BUCKET, {
        allowedMimeTypes: DOG_MEDIA_MIME_TYPES,
        fileSizeLimit: "26214400",
        public: true
    });
    if (bucketError) {
        throw new Error(`Supabase media bucket update failed: ${bucketError.message}`);
    }
    const { error: uploadError } = await supabase.storage.from(DOG_PHOTOS_BUCKET).upload(desiredPath, optimizedBody, {
        contentType: "video/mp4",
        upsert: true
    });
    if (uploadError) {
        throw new Error(`Supabase video upload failed: ${uploadError.message}`);
    }
    const { data } = supabase.storage.from(DOG_PHOTOS_BUCKET).getPublicUrl(desiredPath);
    let backblazeMirrorError;
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$backblaze$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uploadBufferToBackblaze"])({
            body: optimizedBody,
            contentType: "video/mp4",
            desiredPath
        });
    } catch (error) {
        backblazeMirrorError = error instanceof Error ? error.message : "Unknown Backblaze mirror error";
    }
    return {
        backblazeMirrorError,
        publicUrl: data.publicUrl,
        storagePath: desiredPath
    };
}
function normalizePhotoFiles(formData) {
    return formData.getAll("photo_files").filter((value)=>value instanceof File && value.size > 0);
}
function getOptionalVideoFile(formData) {
    const file = formData.get("video_file");
    return file instanceof File && file.size > 0 ? file : null;
}
async function readLocalPhotoFolder(folderInput) {
    if (!folderInput) return [];
    const repoRoot = process.cwd();
    const baseDir = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(repoRoot, "pawjaidogs");
    const requestedDir = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].resolve(baseDir, folderInput);
    const normalizedBaseDir = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].resolve(baseDir);
    if (requestedDir !== normalizedBaseDir && !requestedDir.startsWith(`${normalizedBaseDir}${__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].sep}`)) {
        throw new Error("Local photo folder must be inside the pawjaidogs directory.");
    }
    const entries = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].readdir(requestedDir, {
        withFileTypes: true
    });
    const files = entries.filter((entry)=>entry.isFile() && IMAGE_EXTENSIONS.has(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(entry.name).toLowerCase())).map((entry)=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(requestedDir, entry.name)).sort((a, b)=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].basename(a).localeCompare(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].basename(b), undefined, {
            numeric: true
        }));
    if (files.length === 0) {
        throw new Error("No image files were found in that folder.");
    }
    return Promise.all(files.map(async (filePath)=>({
            body: await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].readFile(filePath),
            contentType: contentTypeFromExtension(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(filePath)),
            extension: __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(filePath).replace(/^\./, "")
        })));
}
function contentTypeFromExtension(extension) {
    switch(extension.toLowerCase()){
        case ".avif":
            return "image/avif";
        case ".gif":
            return "image/gif";
        case ".heic":
            return "image/heic";
        case ".heif":
            return "image/heif";
        case ".jpeg":
        case ".jpg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".webp":
            return "image/webp";
        default:
            return "application/octet-stream";
    }
}
async function unlockAdminGateAction(_prevState, formData) {
    const passphrase = getString(formData, "passphrase");
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$admin$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateAdminPassphrase"])(passphrase)) {
        return {
            message: "That passphrase is incorrect.",
            status: "error"
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$admin$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["openAdminGate"])();
    return {
        message: "Access granted. Reloading admin tools...",
        status: "success"
    };
}
async function lockAdminGateAction() {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$admin$2d$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["closeAdminGate"])();
}
async function createDogListingAction(_prevState, formData) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const fieldErrors = {};
    const name = getString(formData, "name");
    const shelterId = getString(formData, "shelter_id");
    const ageMonths = getOptionalNumber(formData, "age_months");
    const weightKg = getOptionalNumber(formData, "weight_kg");
    const photoUrls = normalizePhotoUrls(formData);
    const photoFiles = normalizePhotoFiles(formData);
    const videoFile = getOptionalVideoFile(formData);
    const localPhotoFolder = getString(formData, "local_photo_folder");
    const careTags = getStringValues(formData, "care_tag");
    const traitPairs = [
        ...normalizeStructuredTraits(formData),
        ...normalizeTraitPairs(formData)
    ];
    if (!name) {
        fieldErrors.name = "Dog name is required.";
    }
    if (!shelterId) {
        fieldErrors.shelter_id = "Choose a shelter for this listing.";
    }
    if (Number.isNaN(ageMonths) || typeof ageMonths === "number" && ageMonths < 0) {
        fieldErrors.age_months = "Age must be a non-negative number of months.";
    }
    if (Number.isNaN(weightKg) || typeof weightKg === "number" && weightKg < 0) {
        fieldErrors.weight_kg = "Weight must be a non-negative number.";
    }
    for (const [index, url] of photoUrls.entries()){
        try {
            // Validate formatting while still allowing any public host.
            new URL(url);
        } catch  {
            fieldErrors[`photo_url_${index}`] = `Photo ${index + 1} needs a valid URL.`;
        }
    }
    for (const [index, file] of photoFiles.entries()){
        if (!isHeicFile(file) && !file.type.startsWith("image/")) {
            fieldErrors[`photo_file_${index}`] = `${file.name} is not an image file.`;
        }
    }
    if (videoFile) {
        if (!videoFile.type.startsWith("video/")) {
            fieldErrors.video_file = `${videoFile.name} is not a video file.`;
        } else if (videoFile.size > MAX_VIDEO_UPLOAD_BYTES) {
            fieldErrors.video_file = "Please use a video under 100MB. It will be trimmed and compressed after upload.";
        }
    }
    for (const [index, pair] of traitPairs.entries()){
        if (!pair.traitType || !pair.traitValue) {
            fieldErrors[`trait_${index}`] = "Each trait needs both a label and a value.";
        }
    }
    if (Object.keys(fieldErrors).length > 0) {
        return {
            fieldErrors,
            message: "Please fix the listed fields and try again.",
            status: "error"
        };
    }
    const dogSocialStyle = getOptionalString(formData, "dog_social_style");
    const peopleFriendliness = getOptionalString(formData, "people_friendliness");
    const goodWithDogs = getOptionalBooleanValue(formData, "good_with_dogs_value") ?? (dogSocialStyle === "Friendly and playful" ? true : dogSocialStyle === "Prefer to be solo" ? false : null);
    const goodWithCats = getOptionalBooleanValue(formData, "good_with_cats_value");
    const goodWithKids = getOptionalBooleanValue(formData, "good_with_kids_value");
    const humanFriendly = getOptionalBooleanValue(formData, "human_friendly_value") ?? (peopleFriendliness === "Comfortable being petted by strangers" ? true : peopleFriendliness ? false : null);
    const visibleCareTags = careTags.filter((tag)=>tag !== "No medical needs");
    const specialNeeds = getOptionalString(formData, "special_needs") ?? (visibleCareTags.length > 0 ? visibleCareTags.join(", ") : null);
    const dogNumber = await getNextDogNumber(supabase);
    const dogPayload = {
        adoption_status: getEnumValue(formData, "adoption_status", DOG_ADOPTION_STATUSES, "draft") ?? "draft",
        age_months: ageMonths,
        animal_friendly: getBoolean(formData, "animal_friendly"),
        background: getOptionalString(formData, "background"),
        breed: getOptionalString(formData, "breed"),
        dog_friendly: goodWithDogs,
        energy_level: getEnumValue(formData, "energy_level", DOG_ENERGY_LEVELS) ?? null,
        gender: getEnumValue(formData, "gender", DOG_GENDERS, "unknown") ?? "unknown",
        good_with_cats: goodWithCats,
        good_with_dogs: goodWithDogs,
        good_with_kids: goodWithKids,
        house_trained: getOptionalBooleanValue(formData, "house_trained_value") ?? getBoolean(formData, "house_trained"),
        human_friendly: humanFriendly,
        leash_trained: getBoolean(formData, "leash_trained"),
        name,
        shelter_id: shelterId,
        size: getEnumValue(formData, "size", DOG_SIZES) ?? null,
        special_needs: specialNeeds,
        sterilized: getBoolean(formData, "sterilized"),
        weight_kg: weightKg
    };
    const { data: insertedDog, error: insertDogError } = await supabase.from("dogs").insert(dogPayload).select("id").single();
    if (insertDogError || !insertDogError && !insertedDog) {
        return {
            message: insertDogError?.message ?? "Something went wrong while creating the dog listing.",
            status: "error"
        };
    }
    let backblazeMirrorWarningCount = 0;
    let coverPhotoUrl = null;
    if (photoUrls.length > 0 || photoFiles.length > 0 || localPhotoFolder) {
        const uploadedPhotos = [];
        const backblazeMirrorWarnings = [];
        let photoIndex = 0;
        if (localPhotoFolder) {
            try {
                const localPhotos = await readLocalPhotoFolder(localPhotoFolder);
                for (const photo of localPhotos){
                    const uploaded = await uploadPhotoBuffer({
                        body: photo.body,
                        contentType: photo.contentType,
                        dogName: name,
                        dogNumber,
                        extension: photo.extension,
                        photoIndex,
                        supabase
                    });
                    if (uploaded.backblazeMirrorError) {
                        backblazeMirrorWarnings.push(`photo ${photoIndex + 1}: ${uploaded.backblazeMirrorError}`);
                    }
                    uploadedPhotos.push(uploaded);
                    photoIndex += 1;
                }
            } catch (error) {
                return {
                    dogId: insertedDog.id,
                    message: `The dog was created, but the local photo folder could not be imported: ${error instanceof Error ? error.message : "Unknown folder import error"}`,
                    status: "error"
                };
            }
        }
        for (const file of photoFiles){
            try {
                const uploaded = await uploadPhotoBuffer({
                    body: Buffer.from(await file.arrayBuffer()),
                    contentType: file.type,
                    dogName: name,
                    dogNumber,
                    extension: guessExtensionFromFileName(file.name) ?? extensionFromContentType(file.type),
                    photoIndex,
                    supabase
                });
                if (uploaded.backblazeMirrorError) {
                    backblazeMirrorWarnings.push(`${file.name}: ${uploaded.backblazeMirrorError}`);
                }
                uploadedPhotos.push(uploaded);
                photoIndex += 1;
            } catch (error) {
                return {
                    dogId: insertedDog.id,
                    message: `The dog was created, but ${file.name} could not be uploaded to public photo storage: ${error instanceof Error ? error.message : "Unknown upload error"}`,
                    status: "error"
                };
            }
        }
        for (const [index, url] of photoUrls.entries()){
            try {
                const uploaded = await uploadPhotoFromSourceUrl({
                    dogName: name,
                    dogNumber,
                    photoIndex,
                    sourceUrl: url,
                    supabase
                });
                if (uploaded.backblazeMirrorError) {
                    backblazeMirrorWarnings.push(`photo URL ${index + 1}: ${uploaded.backblazeMirrorError}`);
                }
                uploadedPhotos.push(uploaded);
                photoIndex += 1;
            } catch (error) {
                return {
                    dogId: insertedDog.id,
                    message: `The dog was created, but photo URL ${index + 1} could not be moved to public photo storage: ${error instanceof Error ? error.message : "Unknown upload error"}`,
                    status: "error"
                };
            }
        }
        const photoRows = uploadedPhotos.map((photo, index)=>({
                dog_id: insertedDog.id,
                is_cover: index === 0,
                public_url: photo.publicUrl,
                sort_order: index,
                storage_path: photo.storagePath
            }));
        coverPhotoUrl = uploadedPhotos[0]?.publicUrl ?? null;
        const { error: photoError } = await supabase.from("dog_photos").insert(photoRows);
        if (photoError) {
            return {
                dogId: insertedDog.id,
                message: `The dog was created, but saving the photos failed: ${photoError.message}`,
                status: "error"
            };
        }
        if (backblazeMirrorWarnings.length > 0) {
            backblazeMirrorWarningCount = backblazeMirrorWarnings.length;
        }
    }
    if (videoFile) {
        try {
            const uploadedVideo = await uploadVideoFile({
                dogName: name,
                dogNumber,
                file: videoFile,
                supabase
            });
            const videoRows = [
                {
                    dog_id: insertedDog.id,
                    trait_type: "cover_video_url",
                    trait_value: uploadedVideo.publicUrl
                },
                {
                    dog_id: insertedDog.id,
                    trait_type: "cover_video_storage_path",
                    trait_value: uploadedVideo.storagePath
                }
            ];
            if (coverPhotoUrl) {
                videoRows.push({
                    dog_id: insertedDog.id,
                    trait_type: "cover_video_poster_url",
                    trait_value: coverPhotoUrl
                });
            }
            const { error: videoError } = await supabase.from("dog_traits").insert(videoRows);
            if (videoError) {
                return {
                    dogId: insertedDog.id,
                    message: `The dog was created, but saving the video metadata failed: ${videoError.message}`,
                    status: "error"
                };
            }
            if (uploadedVideo.backblazeMirrorError) {
                backblazeMirrorWarningCount += 1;
            }
        } catch (error) {
            return {
                dogId: insertedDog.id,
                message: `The dog was created, but the video could not be compressed and uploaded: ${error instanceof Error ? error.message : "Unknown video upload error"}`,
                status: "error"
            };
        }
    }
    if (traitPairs.length > 0) {
        const traitRows = traitPairs.map((pair)=>({
                dog_id: insertedDog.id,
                trait_type: pair.traitType,
                trait_value: pair.traitValue
            }));
        const { error: traitError } = await supabase.from("dog_traits").insert(traitRows);
        if (traitError) {
            return {
                dogId: insertedDog.id,
                message: `The dog was created, but saving the custom traits failed: ${traitError.message}`,
                status: "error"
            };
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dogs");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/dogs/new");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])(`/dogs/${insertedDog.id}`);
    return {
        dogId: insertedDog.id,
        message: backblazeMirrorWarningCount > 0 ? `Dog listing created and photos saved to Supabase. Backblaze mirror needs attention for ${backblazeMirrorWarningCount} photo(s).` : "Dog listing created successfully.",
        status: "success"
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    unlockAdminGateAction,
    lockAdminGateAction,
    createDogListingAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(unlockAdminGateAction, "60fabb839836a79cc29a1b0f6da2316e534ee0e2a3", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(lockAdminGateAction, "0040adac30c0e2d1b1a29743ab15ced00a356a91ba", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createDogListingAction, "60a6b10d2d51f45ef8bbf3f96964d71c04f8a40dec", null);
}),
"[project]/.next-internal/server/app/admin/dogs/new/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/app/admin/dogs/new/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$dogs$2f$new$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/admin/dogs/new/actions.ts [app-rsc] (ecmascript)");
;
;
;
;
;
}),
"[project]/.next-internal/server/app/admin/dogs/new/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/app/admin/dogs/new/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "0040adac30c0e2d1b1a29743ab15ced00a356a91ba",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$dogs$2f$new$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["lockAdminGateAction"],
    "00b66fc88710294174bbe49d3599c867d17bcac44d",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureCurrentUserProfile"],
    "60a6b10d2d51f45ef8bbf3f96964d71c04f8a40dec",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$dogs$2f$new$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createDogListingAction"],
    "60fabb839836a79cc29a1b0f6da2316e534ee0e2a3",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$dogs$2f$new$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unlockAdminGateAction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$dogs$2f$new$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$app$2f$admin$2f$dogs$2f$new$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/dogs/new/page/actions.js { ACTIONS_MODULE0 => "[project]/app/auth/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/app/admin/dogs/new/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$dogs$2f$new$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/admin/dogs/new/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__12~e3fb._.js.map
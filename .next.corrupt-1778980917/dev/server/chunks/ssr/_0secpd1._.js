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
"[project]/utils/ad-date-range.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseAdDateRange",
    ()=>parseAdDateRange
]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
function parseAdDateRange(startDateValue, endDateValue) {
    const startDate = String(startDateValue ?? "").trim();
    const endDate = String(endDateValue ?? "").trim();
    if (!startDate || !endDate) {
        throw new Error("Start and end dates are required.");
    }
    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
        throw new Error("Dates must use YYYY-MM-DD format.");
    }
    if (endDate < startDate) {
        throw new Error("End date must be on or after the start date.");
    }
    return {
        endDate,
        startDate
    };
}
}),
"[project]/app/admin/ads/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4002de018afc9b5be13e50b7bd931ef14a5ddf8109":{"name":"deleteAdAction"},"60264c17630b5d4a1a5a52fc373e1304a475f0d3fe":{"name":"toggleAdAction"},"6050e5fca1beab285ccfa42165d17e95d9ebf66d17":{"name":"createAdAction"},"70ee7abfeb1282e124a0e8677e45f6421269637255":{"name":"updateAdDatesAction"}},"app/admin/ads/actions.ts",""] */ __turbopack_context__.s([
    "createAdAction",
    ()=>createAdAction,
    "deleteAdAction",
    ()=>deleteAdAction,
    "toggleAdAction",
    ()=>toggleAdAction,
    "updateAdDatesAction",
    ()=>updateAdDatesAction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$backblaze$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/backblaze.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$ad$2d$date$2d$range$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/ad-date-range.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
function randomHex(bytes = 4) {
    return Math.floor(Math.random() * 16 ** (bytes * 2)).toString(16).padStart(bytes * 2, "0");
}
async function createAdAction(_prev, formData) {
    const companyName = formData.get("company_name")?.trim();
    const contactInfo = formData.get("contact_info")?.trim() || null;
    const clickUrl = formData.get("click_url")?.trim();
    const isActive = formData.get("is_active") === "on";
    const imageFile = formData.get("image_file");
    if (!companyName) return {
        error: "Company name is required."
    };
    if (!clickUrl) return {
        error: "Click URL is required."
    };
    if (!imageFile || imageFile.size === 0) return {
        error: "Ad image is required."
    };
    if (!imageFile.type.startsWith("image/")) return {
        error: "File must be an image."
    };
    let dateRange;
    try {
        dateRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$ad$2d$date$2d$range$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseAdDateRange"])(formData.get("start_date"), formData.get("end_date"));
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Dates are invalid."
        };
    }
    const body = Buffer.from(await imageFile.arrayBuffer());
    const ext = imageFile.type.includes("png") ? "png" : imageFile.type.includes("webp") ? "webp" : "jpg";
    const desiredPath = `ads/${Date.now()}-${randomHex(4)}.${ext}`;
    let imageUrl;
    try {
        const uploaded = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$backblaze$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uploadBufferToBackblaze"])({
            body,
            contentType: imageFile.type,
            desiredPath
        });
        imageUrl = uploaded.publicUrl;
    } catch (err) {
        return {
            error: `B2 upload failed: ${err instanceof Error ? err.message : "unknown error"}`
        };
    }
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const { error: dbError } = await supabase.from("ads").insert({
        company_name: companyName,
        contact_info: contactInfo,
        image_url: imageUrl,
        click_url: clickUrl,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        is_active: isActive
    });
    if (dbError) return {
        error: `DB insert failed: ${dbError.message}`
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/ads");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/");
    return {
        success: `Ad for ${companyName} created.`
    };
}
async function deleteAdAction(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    await supabase.from("ads").delete().eq("id", id);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/ads");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/");
}
async function toggleAdAction(id, isActive) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    await supabase.from("ads").update({
        is_active: isActive
    }).eq("id", id);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/ads");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/");
}
async function updateAdDatesAction(id, startDateValue, endDateValue) {
    let dateRange;
    try {
        dateRange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$ad$2d$date$2d$range$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseAdDateRange"])(startDateValue, endDateValue);
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Dates are invalid."
        };
    }
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const { error } = await supabase.from("ads").update({
        end_date: dateRange.endDate,
        start_date: dateRange.startDate,
        updated_at: new Date().toISOString()
    }).eq("id", id);
    if (error) {
        return {
            error: `DB update failed: ${error.message}`
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/ads");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/");
    return {
        success: "Ad dates updated."
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createAdAction,
    deleteAdAction,
    toggleAdAction,
    updateAdDatesAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createAdAction, "6050e5fca1beab285ccfa42165d17e95d9ebf66d17", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteAdAction, "4002de018afc9b5be13e50b7bd931ef14a5ddf8109", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(toggleAdAction, "60264c17630b5d4a1a5a52fc373e1304a475f0d3fe", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateAdDatesAction, "70ee7abfeb1282e124a0e8677e45f6421269637255", null);
}),
"[project]/.next-internal/server/app/admin/ads/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/app/admin/ads/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$ads$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/admin/ads/actions.ts [app-rsc] (ecmascript)");
;
;
;
;
;
}),
"[project]/.next-internal/server/app/admin/ads/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/app/admin/ads/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00b66fc88710294174bbe49d3599c867d17bcac44d",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureCurrentUserProfile"],
    "4002de018afc9b5be13e50b7bd931ef14a5ddf8109",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$ads$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteAdAction"],
    "60264c17630b5d4a1a5a52fc373e1304a475f0d3fe",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$ads$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["toggleAdAction"],
    "6050e5fca1beab285ccfa42165d17e95d9ebf66d17",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$ads$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdAction"],
    "70ee7abfeb1282e124a0e8677e45f6421269637255",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$ads$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateAdDatesAction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$ads$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$app$2f$admin$2f$ads$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/ads/page/actions.js { ACTIONS_MODULE0 => "[project]/app/auth/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/app/admin/ads/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$admin$2f$ads$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/admin/ads/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_0secpd1._.js.map
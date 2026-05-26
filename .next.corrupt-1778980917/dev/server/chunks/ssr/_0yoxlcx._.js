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
"[project]/app/actions/preferences.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00e9b2dc67651fa1ac14743488550cd49edcae88d8":{"name":"getSavedFilterPreferences"},"4096307bfbfc43de82f2ce2fcda2a6be25c6d37d4d":{"name":"saveFilterPreferences"}},"app/actions/preferences.ts",""] */ __turbopack_context__.s([
    "getSavedFilterPreferences",
    ()=>getSavedFilterPreferences,
    "saveFilterPreferences",
    ()=>saveFilterPreferences
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/adopter.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/supabase/admin.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
function mapSize(label) {
    const map = {
        Small: "small",
        Medium: "medium",
        Large: "large"
    };
    return map[label] ?? "medium";
}
function mapEnergy(label) {
    const map = {
        Low: "low",
        Medium: "medium",
        High: "high"
    };
    return map[label] ?? "medium";
}
function sizeLabel(size) {
    if (!size) return null;
    return size.charAt(0).toUpperCase() + size.slice(1);
}
function energyLabel(energy) {
    if (!energy) return null;
    return energy.charAt(0).toUpperCase() + energy.slice(1);
}
async function getSavedFilterPreferences() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const adopter = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureAdopterForUser"])(supabase, user);
    const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const { data: preferences } = await admin.from("adopter_preferences").select("preferred_size, preferred_energy_level, good_with_kids, good_with_dogs, good_with_cats").eq("adopter_id", adopter.id).maybeSingle();
    if (!preferences) return null;
    const answers = {};
    const size = sizeLabel(preferences.preferred_size);
    const energy = energyLabel(preferences.preferred_energy_level);
    // Question indices match current filter page order:
    // 0=Size, 1=Age, 2=Breed, 3=Activity, 4=Protect, 5=Affection,
    // 6=Training, 7=People, 8=Dogs, 9=Cats, 10=Kids, 11=Special
    if (size) answers[0] = [
        size
    ];
    if (energy) answers[3] = [
        energy
    ];
    if (preferences.good_with_dogs !== null) {
        answers[8] = [
            preferences.good_with_dogs ? "Friendly and playful" : "Prefer to be solo"
        ];
    }
    if (preferences.good_with_cats !== null) {
        answers[9] = [
            preferences.good_with_cats ? "Cat-friendly" : "Not sure / No"
        ];
    }
    if (preferences.good_with_kids !== null) {
        answers[10] = [
            preferences.good_with_kids ? "Kid-friendly" : "Not sure / No"
        ];
    }
    return Object.keys(answers).length ? answers : null;
}
async function saveFilterPreferences(answers) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // not logged in — silently skip
    const adopter = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$adopter$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureAdopterForUser"])(supabase, user);
    const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$supabase$2f$admin$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAdminClient"])();
    const preferred_size = answers.sizes.length === 1 ? mapSize(answers.sizes[0]) : null;
    const preferred_energy_level = answers.energyLevels.length === 1 ? mapEnergy(answers.energyLevels[0]) : null;
    const updates = {
        preferred_size,
        preferred_energy_level,
        good_with_kids: answers.goodWithKids,
        good_with_dogs: answers.goodWithDogs,
        good_with_cats: answers.goodWithCats
    };
    const { data: existing } = await admin.from("adopter_preferences").select("adopter_id").eq("adopter_id", adopter.id).maybeSingle();
    if (existing) {
        await admin.from("adopter_preferences").update(updates).eq("adopter_id", adopter.id);
    } else {
        await admin.from("adopter_preferences").insert({
            adopter_id: adopter.id,
            ...updates
        });
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getSavedFilterPreferences,
    saveFilterPreferences
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getSavedFilterPreferences, "00e9b2dc67651fa1ac14743488550cd49edcae88d8", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(saveFilterPreferences, "4096307bfbfc43de82f2ce2fcda2a6be25c6d37d4d", null);
}),
"[project]/.next-internal/server/app/filter/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/app/actions/preferences.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$preferences$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/actions/preferences.ts [app-rsc] (ecmascript)");
;
;
;
}),
"[project]/.next-internal/server/app/filter/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/auth/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/app/actions/preferences.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00b66fc88710294174bbe49d3599c867d17bcac44d",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureCurrentUserProfile"],
    "00e9b2dc67651fa1ac14743488550cd49edcae88d8",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$preferences$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSavedFilterPreferences"],
    "4096307bfbfc43de82f2ce2fcda2a6be25c6d37d4d",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$preferences$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveFilterPreferences"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$filter$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$app$2f$actions$2f$preferences$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/filter/page/actions.js { ACTIONS_MODULE0 => "[project]/app/auth/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/app/actions/preferences.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$auth$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/auth/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$actions$2f$preferences$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/actions/preferences.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_0yoxlcx._.js.map
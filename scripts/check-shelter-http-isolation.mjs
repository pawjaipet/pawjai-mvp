// Read-only portal checks. Generates temporary sessions, never sends login emails.
// node --env-file=.env.local scripts/check-shelter-http-isolation.mjs http://localhost:3107
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const base = process.argv[2] || "http://localhost:3107";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const { data: shelters, error } = await admin.from("shelters").select("id,name");
assert.equal(error, null);
const { data: members } = await admin.from("shelter_users").select("shelter_id,profile_id").in("role", ["owner", "staff"]);
const { data: dogs } = await admin.from("dogs").select("id,shelter_id");
const { data: bookings } = await admin.from("appointments").select("id,shelter_id");
const { data: donations } = await admin.from("donation_intents").select("id,shelter_id");
const sessions = [];
let checks = 0;
const timings = [];
function redirected({ response, body }, destination) {
  return [303,307,308].includes(response.status)
    || (response.status === 200 && body.includes('NEXT_REDIRECT') && body.includes(destination));
}
try {
  for (const shelter of shelters) {
    const member = members.find((m) => m.shelter_id === shelter.id);
    assert.ok(member);
    const { data: user } = await admin.auth.admin.getUserById(member.profile_id);
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.user.email });
    assert.equal(linkError, null);
    const jar = new Map();
    const client = createServerClient(url, anon, { cookies: {
      getAll: () => [...jar].map(([name,value]) => ({name,value})),
      setAll: (cookies) => cookies.forEach(({name,value}) => jar.set(name,value)),
    } });
    const { error: loginError } = await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" });
    assert.equal(loginError, null);
    sessions.push({ client, jar, shelter, path: `/shelter/${shelter.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}` });
  }
  // Three shelters concurrently, sequential requests within each account.
  const results = await Promise.allSettled(sessions.map(async (session) => {
    async function request(path) {
      const started = performance.now();
      const response = await fetch(`${base}${path}`, { headers: { Cookie: [...session.jar].map(([k,v])=>`${k}=${v}`).join("; ") }, redirect: "manual" });
      const body = await response.text();
      timings.push(performance.now()-started);
      return { response, body };
    }
    for (const view of ["profile", "dogs", "bookings", "donations", "messages", "dogs"]) {
      const {response,body} = await request(`${session.path}?view=${view}`);
      assert.equal(response.status, 200, `${view} workspace failed`);
      for (const row of [...dogs,...bookings,...donations].filter((r)=>r.shelter_id!==session.shelter.id)) {
        assert.ok(!body.includes(row.id), `Foreign record serialized in ${view}`);
      }
      checks++;
    }
    for (const other of sessions.filter((s)=>s.shelter.id!==session.shelter.id)) {
      const foreignPortal = await request(other.path);
      assert.ok(redirected(foreignPortal, '/shelter'), `Foreign portal was accessible (${foreignPortal.response.status})`);
      checks++;
      const dog = dogs.find((d)=>d.shelter_id===other.shelter.id);
      if (dog) {
        const result=await request(`${session.path}/dogs/${dog.id}/edit`);
        assert.ok(result.response.status === 404 || redirected(result, '/shelter'), "Foreign dog editor was accessible");
        checks++;
      }
      const donation=donations.find((d)=>d.shelter_id===other.shelter.id);
      if (donation) {
        assert.equal((await request(`/api/donation-slips/${donation.id}`)).response.status,404);
        checks++;
      }
    }
    const adminResult = await request("/admin");
    assert.ok(redirected(adminResult, '/admin/login'),
    `Shelter account reached admin (${adminResult.response.status})`);
    checks++;
  }));
  for (const result of results) if (result.status === 'rejected') throw result.reason;
  timings.sort((a,b)=>a-b);
  console.log(JSON.stringify({ shelters: sessions.length, passed: checks, concurrentShelters: 3, requests:timings.length, medianMs:Math.round(timings[Math.floor(timings.length/2)]), p95Ms:Math.round(timings[Math.floor(timings.length*.95)]), writes:0 }));
} finally {
  await Promise.all(sessions.map(({client})=>client.auth.signOut({scope:"local"})));
}

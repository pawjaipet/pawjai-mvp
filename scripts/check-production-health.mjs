import dns from "node:dns/promises";
import https from "node:https";

const checks = [
  {
    name: "apex domain",
    host: "pawjaipet.com",
    url: "https://pawjaipet.com/",
  },
  {
    name: "www app",
    host: "www.pawjaipet.com",
    url: "https://www.pawjaipet.com/",
  },
  {
    name: "admin",
    host: "www.pawjaipet.com",
    url: "https://www.pawjaipet.com/admin",
  },
  {
    name: "media cdn dns",
    host: "media.pawjaipet.com",
  },
];

const timeoutMs = Number(process.env.PAWJAI_HEALTH_TIMEOUT_MS ?? 15000);

function requestHead(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "HEAD",
        timeout: timeoutMs,
      },
      (response) => {
        response.resume();
        resolve({
          location: response.headers.location,
          statusCode: response.statusCode ?? 0,
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error(`Timed out after ${timeoutMs}ms`));
    });
    request.on("error", reject);
    request.end();
  });
}

async function resolveHost(host) {
  const [aRecords, cnameRecords] = await Promise.allSettled([
    dns.resolve4(host),
    dns.resolveCname(host),
  ]);
  const addresses = aRecords.status === "fulfilled" ? aRecords.value : [];
  const cnames = cnameRecords.status === "fulfilled" ? cnameRecords.value : [];

  if (addresses.length === 0 && cnames.length === 0) {
    const reason = aRecords.status === "rejected" ? aRecords.reason : cnameRecords.reason;
    throw reason instanceof Error ? reason : new Error(String(reason));
  }

  return { addresses, cnames };
}

const failures = [];

for (const check of checks) {
  try {
    const resolved = await resolveHost(check.host);
    console.log(`PASS dns ${check.name}: ${check.host}`, resolved);

    if (!check.url) continue;

    const response = await requestHead(check.url);
    if (response.statusCode < 200 || response.statusCode >= 400) {
      throw new Error(`HTTP ${response.statusCode}${response.location ? ` -> ${response.location}` : ""}`);
    }
    console.log(`PASS http ${check.name}: ${check.url} ${response.statusCode}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${check.name}: ${message}`);
    console.error(`FAIL ${check.name}: ${message}`);
  }
}

if (failures.length > 0) {
  console.error("\nProduction health check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nProduction health check passed.");

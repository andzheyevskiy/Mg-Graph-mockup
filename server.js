const fetch = require("cross-fetch");

// Provide global fetch / Headers / Request / Response for graph client
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;
const express = require("express");
const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");

const app = express();
app.use(express.json());

// --- helper: create Graph client with app-only auth ---
function createGraphClient(tenantId, clientId, clientSecret) {
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // we implement a tiny authProvider instead of using the SDK's authProviders
  const authProvider = {
    getAccessToken: async () => {
      const scope = "https://graph.microsoft.com/.default";
      const token = await credential.getToken(scope);
      return token.token;
    },
  };

  const client = Client.init({
    authProvider: async (done) => {
      try {
        const token = await authProvider.getAccessToken();
        done(null, token);
      } catch (err) {
        done(err, null);
      }
    },
  });

  return client;
}

async function handleGraphRequests(req, res, route, filter) {
  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
  }

  try {
    const graph = createGraphClient(tenantId, clientId, clientSecret);
    let request = graph.api(route)
    if (filter) {
      request = request.filter(filter);
    }
    const result = await request.get();
    res.json(result.value || result);
  } catch (err) {
    console.error(`Error: ${route}`, err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
async function obtenerClaveBitLocker(req, res) {
  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
  }

  try {
    const graph = createGraphClient(tenantId, clientId, clientSecret);

    const list = await graph.api("https://graph.microsoft.com/beta/informationProtection/bitlocker/recoveryKeys").get();

    for (const entry of list.value) {
      const url = `https://graph.microsoft.com/beta/informationProtection/bitlocker/recoveryKeys/${entry.id}?$select=key`;
      const keyResult = await graph.api(url).get();
      entry.recoveryKey = keyResult.key; 
    }
    res.json(list.value);

  } catch (err) {
    console.error("BitLocker error:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}


// Solicitudes
app.post("/mfa", async (req, res) => { await handleGraphRequests(req, res, "/reports/authenticationMethods/userRegistrationDetails") });
app.post("/users", async (req, res) => { await handleGraphRequests(req, res, "/users", "userType eq 'Member'") });
app.post("/externalusers", async (req, res) => { await handleGraphRequests(req, res, "/users", "userType eq 'Guest'") });
app.post("/computers", async (req, res) => { await handleGraphRequests(req, res, "/devices") });
app.post("/intuneDevices", async (req, res) => { await handleGraphRequests(req, res, "/deviceManagement/managedDevices") });
app.post("/DMDE", async (req, res) => { await handleGraphRequests(req, res, "https://graph.microsoft.com/beta/deviceManagement/configurationPolicies", "startswith(name,'DMDE')") });
app.post("/DAC", async (req, res) => { await handleGraphRequests(req, res, "/identity/conditionalAccess/policies", "startswith(displayName,'DAC')") });
app.post("/Bitlocker", async (req, res) => { await obtenerClaveBitLocker(req, res)});


// --- start server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

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


// --- POST /mfa ---
app.post("/mfa", async (req, res) => {
  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
  }

  try {
    const graph = createGraphClient(tenantId, clientId, clientSecret);
    const result = await graph.api("/reports/authenticationMethods/userRegistrationDetails").get();
    res.json(result.value || result);
  } catch (err) {
    console.error("Error /users:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

// --- POST /users ---
app.post("/users", async (req, res) => {
  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
  }

  try {
    const graph = createGraphClient(tenantId, clientId, clientSecret);
    const result = await graph.api("/users").filter("userType eq 'Member'").get();
    res.json(result.value || result);
  } catch (err) {
    console.error("Error /users:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

// --- POST /externalusers ---
app.post("/externalusers", async (req, res) => {
  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
  }

  try {
    const graph = createGraphClient(tenantId, clientId, clientSecret);
    const result = await graph.api("/users").filter("userType eq 'Guest'").get();
    res.json(result.value || result);
  } catch (err) {
    console.error("Error /users:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

// --- POST /computers (devices) ---
app.post("/computers", async (req, res) => {
  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
  }

  try {
    const graph = createGraphClient(tenantId, clientId, clientSecret);
    const result = await graph.api("/devices").get();
    res.json(result.value || result);
  } catch (err) {
    console.error("Error /computers:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});


// --- POST /intuneDevices ---
app.post("/intuneDevices", async (req, res) => {
  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
  }

  try {
    const graph = createGraphClient(tenantId, clientId, clientSecret);
    const result = await graph.api("/deviceManagement/managedDevices").get();
    res.json(result.value || result);
  } catch (err) {
    console.error("Error /intuneDevices:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

// --- POST /DMDE ---
app.post("/DMDE", async (req, res) => {
  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
  }

  try {
    const graph = createGraphClient(tenantId, clientId, clientSecret);
    const result = await graph.api("/deviceManagement/deviceConfigurations")
    .filter("startswith(displayName,'DMDE')")
    .get();
    res.json(result.value || result);
  } catch (err) {
    console.error("Error /DMDE:", err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

// --- start server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

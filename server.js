const fetch = require("cross-fetch");

// Provide global fetch / Headers / Request / Response for graph client
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;
const express = require("express");
const app = express();
app.use(express.json());

//Imports REST API
const sendUsers = require("./restAPI/sendUsers")
const sendBitlockerKeys = require("./restAPI/sendBitlockerKeys")
const sendMFA = require("./restAPI/sendMFA")
const sendExternalUsers = require("./restAPI/sendExternalUsers")
const sendGroups = require("./restAPI/sendGroups")
const sendConditionalAccessPolicies = require("./restAPI/sendConditionalAccessPolicies")
const sendDevicesFull = require("./restAPI/sendDevicesFull")
const sendDevices = require("./restAPI/sendDevices")

// REST API
app.post("/users", sendUsers);
app.post("/Bitlocker", sendBitlockerKeys);
app.post("/mfa", sendMFA);
app.post("/externalusers", sendExternalUsers);
app.post("/groups", sendGroups);
app.post("/DAC", sendConditionalAccessPolicies);
app.post("/devicesFull", sendDevicesFull);
app.post("/devices", sendDevices);


// --- start server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

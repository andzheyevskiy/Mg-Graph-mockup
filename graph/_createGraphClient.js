const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");

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

module.exports = createGraphClient
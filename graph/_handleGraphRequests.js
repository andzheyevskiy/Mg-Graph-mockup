const createGraphClient = require('./_createGraphClient');

async function handleGraphRequests({ tenantId, clientId, clientSecret, route, filter }) {
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("tenantId, clientId, clientSecret required");
  }

  const graph = createGraphClient(tenantId, clientId, clientSecret);

  let request = graph.api(route);
  if (filter) {
    request = request.filter(filter);
  }

  const result = await request.get();
  return result.value || result;
}

module.exports = handleGraphRequests;
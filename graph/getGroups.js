const createGraphClient = require("./_createGraphClient");

async function getGroups({ tenantId, clientId, clientSecret, groupID }) {
    const graph = createGraphClient(tenantId, clientId, clientSecret);

    let request = graph.api("/groups");

    if (groupID) {
        request = request.filter(`id eq '${groupID}'`);
    }

    // Always expand members
    request = request.expand("members($select=id,displayName,userPrincipalName)");

    const result = await request.get();
    return result.value || [];
}

module.exports = getGroups;

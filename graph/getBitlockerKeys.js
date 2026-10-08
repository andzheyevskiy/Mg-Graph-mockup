const createGraphClient = require("./_createGraphClient");

async function getBitlockerKeys({ tenantId, clientId, clientSecret, deviceID }) {
    const graph = createGraphClient(tenantId, clientId, clientSecret);

    const list = await graph
        .api("https://graph.microsoft.com/beta/informationProtection/bitlocker/recoveryKeys")
        .get();

    let items = list.value || [];

    if (deviceID) {
        items = items.filter(entry => entry.deviceId === deviceID);
    }

    // Fetch each recovery key
    for (const entry of items) {
        const url = `https://graph.microsoft.com/beta/informationProtection/bitlocker/recoveryKeys/${entry.id}?$select=key`;
        const keyResult = await graph.api(url).get();
        entry.recoveryKey = keyResult.key;
    }

    return items;
}

module.exports = getBitlockerKeys;

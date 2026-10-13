const createGraphClient = require("./_createGraphClient");
const handleGraphRequests = require("./_handleGraphRequests");

async function getBitlockerKeys({ tenantId, clientId, clientSecret, deviceID }) {
    const graph = createGraphClient(tenantId, clientId, clientSecret);

    const list = await graph
        .api("https://graph.microsoft.com/beta/informationProtection/bitlocker/recoveryKeys")
        .get();

    let items = list.value || [];

    if (deviceID) {
        items = items.filter(entry => entry.deviceId === deviceID);
    }

    const devices = await handleGraphRequests({
        tenantId,
        clientId,
        clientSecret,
        route: "https://graph.microsoft.com/v1.0/deviceManagement/managedDevices"
    });

    const nameMap = {};
    for (const d of devices) {
        const name = d.deviceName || null;
        if (d.azureADDeviceId) nameMap[d.azureADDeviceId] = name;
        nameMap[d.id] = name;
    }

    const result = [];

    for (const entry of items) {
        const keyResult = await graph
            .api(`https://graph.microsoft.com/beta/informationProtection/bitlocker/recoveryKeys/${entry.id}?$select=key`)
            .get();

        result.push({
            deviceName: nameMap[entry.deviceId] || null,
            deviceId: entry.deviceId,
            volumeType: entry.volumeType,
            id: entry.id,
            recoveryKey: keyResult.key
        });
    }

    return result;
}

module.exports = getBitlockerKeys;

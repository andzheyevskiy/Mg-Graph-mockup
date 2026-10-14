const createGraphClient = require("./_createGraphClient");

async function getDevicesFull({ tenantId, clientId, clientSecret }) {
    const graph = createGraphClient(tenantId, clientId, clientSecret);

    const devicesResp = await graph
        .api("https://graph.microsoft.com/v1.0/deviceManagement/managedDevices")
        .select("id,deviceName,azureADDeviceId,userPrincipalName,operatingSystem,complianceState,managementAgent")
        .get();

    const devices = devicesResp.value || [];

    const deviceMap = {};
    for (const d of devices) {
        deviceMap[d.id] = {
            id: d.id,
            name: d.deviceName,
            user: d.userPrincipalName,
            os: d.operatingSystem,
            managementType: d.managementAgent,
            azureADDeviceId: d.azureADDeviceId,

            compliancePolicies: [],
            dmdePolicies: []
        };
    }

    const dmdeResp = await graph
        .api("https://graph.microsoft.com/beta/deviceManagement/configurationPolicies")
        .filter("startswith(name,'DMDE')")
        .get();

    const dmdePolicies = dmdeResp.value || [];

    for (const policy of dmdePolicies) {
        const statusResp = await graph
            .api(`https://graph.microsoft.com/beta/deviceManagement/deviceConfigurations/${policy.id}/deviceStatuses`)
            .get();

        const statuses = statusResp.value || [];

        for (const s of statuses) {

            // Buscar el deviceId REAL dentro del ID DMDE
            const dmdeId = s.id;

            // Recorrer todos los dispositivos y ver si el ID DMDE contiene su deviceId
            for (const deviceId of Object.keys(deviceMap)) {

                if (dmdeId.includes(deviceId)) {
                    deviceMap[deviceId].dmdePolicies.push({
                        policyId: policy.id,
                        policyName: policy.name,
                        platform: policy.platforms,
                        status: s.status,
                        lastReported: s.lastReportedDateTime
                    });
                }

            }
        }
    }

    return Object.values(deviceMap);
}

module.exports = getDevicesFull;

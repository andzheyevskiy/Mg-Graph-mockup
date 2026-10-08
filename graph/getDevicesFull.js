const createGraphClient = require("./_createGraphClient");

async function getDevicesFull({ tenantId, clientId, clientSecret }) {
    const graph = createGraphClient(tenantId, clientId, clientSecret);

    // ---------------------------------------------------------
    // 1. GET ALL ENTRA / INTUNE DEVICES
    // ---------------------------------------------------------
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
            complianceState: d.complianceState,
            azureADDeviceId: d.azureADDeviceId,

            compliancePolicies: [],
            dmdePolicies: []
        };
    }

    // ---------------------------------------------------------
    // 2. GET COMPLIANCE POLICIES
    // ---------------------------------------------------------
    const compPoliciesResp = await graph
        .api("https://graph.microsoft.com/v1.0/deviceManagement/deviceCompliancePolicies")
        .get();

    const compPolicies = compPoliciesResp.value || [];

    // ---------------------------------------------------------
    // 3. GET COMPLIANCE STATUS PER POLICY
    // ---------------------------------------------------------
    for (const policy of compPolicies) {
        const statusResp = await graph
            .api(`https://graph.microsoft.com/v1.0/deviceManagement/deviceCompliancePolicies/${policy.id}/deviceStatuses`)
            .get();

        const statuses = statusResp.value || [];

        for (const s of statuses) {
            if (deviceMap[s.deviceId]) {
                deviceMap[s.deviceId].compliancePolicies.push({
                    policyId: policy.id,
                    policyName: policy.displayName,
                    status: s.status,
                    lastReported: s.lastReportedDateTime
                });
            }
        }
    }

    // ---------------------------------------------------------
    // 4. GET DMDE AV DIRECTIVES (CONFIGURATION POLICIES)
    // ---------------------------------------------------------
    const dmdeResp = await graph
        .api("https://graph.microsoft.com/beta/deviceManagement/configurationPolicies")
        .filter("startswith(name,'DMDE')")
        .get();

    const dmdePolicies = dmdeResp.value || [];

    // ---------------------------------------------------------
    // 5. GET DMDE STATUS PER POLICY
    // ---------------------------------------------------------
    for (const policy of dmdePolicies) {
        const statusResp = await graph
            .api(`https://graph.microsoft.com/beta/deviceManagement/deviceConfigurations/${policy.id}/deviceStatuses`)
            .get();

        const statuses = statusResp.value || [];

        for (const s of statuses) {
            if (deviceMap[s.deviceId]) {
                deviceMap[s.deviceId].dmdePolicies.push({
                    policyId: policy.id,
                    policyName: policy.name,
                    platform: policy.platforms,
                    status: s.status,
                    lastReported: s.lastReportedDateTime
                });
            }
        }
    }

    // ---------------------------------------------------------
    // 6. RETURN MERGED DEVICE OBJECTS
    // ---------------------------------------------------------
    return Object.values(deviceMap);
}

module.exports = getDevicesFull;

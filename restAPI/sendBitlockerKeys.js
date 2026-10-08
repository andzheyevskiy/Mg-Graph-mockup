const getBitlockerKeys = require("../graph/getBitlockerKeys");

async function sendBitlockerKeys(req, res) {
    const { tenantId, clientId, clientSecret } = req.body;

    if (!tenantId || !clientId || !clientSecret) {
        return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
    }

    const deviceID = req.query.deviceId;

    try {
        const result = await getBitlockerKeys({
            tenantId,
            clientId,
            clientSecret,
            deviceID
        });

        res.json(result);
    } catch (err) {
        console.error("BitLocker error:", err);
        res.status(500).json({ error: err.message || "Unknown error" });
    }
}

module.exports = sendBitlockerKeys;

const getDevicesFull = require("../graph/getDevicesFull");

async function sendDevicesFull(req, res) {
    const { tenantId, clientId, clientSecret } = req.body;

    if (!tenantId || !clientId || !clientSecret) {
        return res.status(400).json({
            error: "tenantId, clientId, clientSecret required"
        });
    }

    try {
        const result = await getDevicesFull({
            tenantId,
            clientId,
            clientSecret
        });

        res.json(result);
    } catch (err) {
        console.error("DevicesFull error:", err);
        res.status(500).json({
            error: err.message || "Unknown error"
        });
    }
}

module.exports = sendDevicesFull;

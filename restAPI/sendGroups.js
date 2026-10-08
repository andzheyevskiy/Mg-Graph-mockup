const getGroups = require("../graph/getGroups");

async function sendGroups(req, res) {
    const { tenantId, clientId, clientSecret } = req.body;
    const groupID = req.query.group; // inline param

    if (!tenantId || !clientId || !clientSecret) {
        return res.status(400).json({ error: "tenantId, clientId, clientSecret required" });
    }

    try {
        const result = await getGroups({
            tenantId,
            clientId,
            clientSecret,
            groupID
        });

        res.json(result);
    } catch (err) {
        console.error("Groups error:", err);
        res.status(500).json({ error: err.message || "Unknown error" });
    }
}

module.exports = sendGroups;
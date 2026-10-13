const getLicences = require("../graph/getLicences")

async function sendDevices(req, res) {
    
    const { tenantId, clientId, clientSecret } = req.body;

    const result = await getLicences({
        tenantId,
        clientId,
        clientSecret
    });

    res.json(result);
}

module.exports = sendDevices;
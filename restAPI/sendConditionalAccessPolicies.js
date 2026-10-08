const getConditionalAccessPolicies = require("../graph/getConditionalAccessPolicies");

async function sendConditionalAccessPolicies(req, res) {
    const { tenantId, clientId, clientSecret } = req.body;

    const result = await getConditionalAccessPolicies({
        tenantId,
        clientId,
        clientSecret
    });

    res.json(result);
}

module.exports = sendConditionalAccessPolicies;

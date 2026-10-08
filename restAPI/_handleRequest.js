const handleGraphRequests = require('../graph/_handleGraphRequests');

async function handleRequest(req, res, route, filter ) {
  const { tenantId, clientId, clientSecret} = req.body;

  try {
    const result = await handleGraphRequests({
      tenantId,
      clientId,
      clientSecret,
      route,
      filter
    });

    res.json(result);
  } catch (err) {
    console.error(`Graph error: ${route}`, err);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}

module.exports = handleRequest;

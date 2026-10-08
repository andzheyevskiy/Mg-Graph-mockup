const handleRequests = require("./_handleRequest")

async function sendDevices(req, res) {

    const device = req.query.device;

    const filter = device
    ? `id eq '${device}'`
    : null;

    await handleRequests(req, res, "/devices", filter)

}

module.exports = sendDevices;
const handleRequests = require("./_handleRequest")

async function sendExternalUsers(req, res) {

    const user = req.query.user;

    const filter = user
    ? `userType eq 'Guest' and id in ('${user}')`
    : "userType eq 'Guest'";

    await handleRequests(req, res, "/users", filter)

}

module.exports = sendExternalUsers;
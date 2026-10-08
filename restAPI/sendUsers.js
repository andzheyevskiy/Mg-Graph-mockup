const handleRequests = require("./_handleRequest")

async function sendUsers(req, res) {

    const user = req.query.user;

    const filter = user
    ? `userType eq 'Member' and id in ('${user}')`
    : "userType eq 'Member'";

    await handleRequests(req, res, "/users", filter)

}

module.exports = sendUsers;
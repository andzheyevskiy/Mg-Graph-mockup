const handleRequests = require("./_handleRequest")

async function sendMFA(req, res) {
    await handleRequests(req, res, "/reports/authenticationMethods/userRegistrationDetails", "userType eq 'Member'")

}

module.exports = sendMFA;
const createGraphClient = require("./_createGraphClient");

// Especial agradecimiento a Copilot por hacer esto.
async function getConditionalAccessPolicies({ tenantId, clientId, clientSecret }) {
    const graph = createGraphClient(tenantId, clientId, clientSecret);

    // 1. Get CA policies filtered by displayName
    const policies = await graph
        .api("/identity/conditionalAccess/policies")
        .filter("startswith(displayName,'DAC')")
        .get();

    const items = policies.value || [];

    // Collect all IDs we need to resolve
    const userIds = new Set();
    const groupIds = new Set();
    const roleIds = new Set();

    for (const p of items) {
        const users = p.conditions?.users;
        if (!users) continue;

        // includeUsers
        for (const u of users.includeUsers || []) {
            if (u !== "all" && u !== "externalUsers") userIds.add(u);
        }

        // includeGroups
        for (const g of users.includeGroups || []) {
            groupIds.add(g);
        }

        // includeRoles
        for (const r of users.includeRoles || []) {
            roleIds.add(r);
        }

        // excludeUsers
        for (const u of users.excludeUsers || []) {
            userIds.add(u);
        }
    }

    // 2. Resolve users
    const resolvedUsers = {};
    if (userIds.size > 0) {
        const userList = await graph
            .api("/users")
            .filter(`id in (${Array.from(userIds).map(id => `'${id}'`).join(",")})`)
            .select("id,displayName,userPrincipalName")
            .get();

        for (const u of userList.value) {
            resolvedUsers[u.id] = {
                displayName: u.displayName,
                upn: u.userPrincipalName
            };
        }
    }

    // 3. Resolve groups
    const resolvedGroups = {};
    if (groupIds.size > 0) {
        const groupList = await graph
            .api("/groups")
            .filter(`id in (${Array.from(groupIds).map(id => `'${id}'`).join(",")})`)
            .select("id,displayName")
            .get();

        for (const g of groupList.value) {
            resolvedGroups[g.id] = {
                displayName: g.displayName
            };
        }
    }

    // 4. Resolve roles
    const resolvedRoles = {};
    if (roleIds.size > 0) {
        const roleList = await graph
            .api("/directoryRoles")
            .filter(`id in (${Array.from(roleIds).map(id => `'${id}'`).join(",")})`)
            .select("id,displayName")
            .get();

        for (const r of roleList.value) {
            resolvedRoles[r.id] = {
                displayName: r.displayName
            };
        }
    }

    // 5. Append resolved names + UPN to each policy
    for (const p of items) {
        const users = p.conditions?.users;
        if (!users) continue;

        p.resolvedAssignments = {
            includeUsers: (users.includeUsers || []).map(u => {
                if (u === "all") return "All users";
                if (u === "externalUsers") return "External users";

                const info = resolvedUsers[u];
                if (!info) return u;

                return `${info.displayName} (${info.upn})`;
            }),

            includeGroups: (users.includeGroups || []).map(g => {
                const info = resolvedGroups[g];
                if (!info) return g;

                return `${info.displayName}`;
            }),

            includeRoles: (users.includeRoles || []).map(r => {
                const info = resolvedRoles[r];
                if (!info) return r;

                return `${info.displayName}`;
            }),

            excludeUsers: (users.excludeUsers || []).map(u => {
                const info = resolvedUsers[u];
                if (!info) return u;

                return `${info.displayName} (${info.upn})`;
            })
        };
    }

    return items;
}

module.exports = getConditionalAccessPolicies;

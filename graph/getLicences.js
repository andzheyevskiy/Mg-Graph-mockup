const createGraphClient = require("./_createGraphClient");
const https = require("https");
const { parse } = require("csv-parse/sync");

async function fetchSkuCsv() {
    return new Promise((resolve, reject) => {
        https.get(
            "https://download.microsoft.com/download/e/3/e/e3e9faf2-f28b-490a-9ada-c6089a1fc5b0/Product%20names%20and%20service%20plan%20identifiers%20for%20licensing.csv",
            res => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve(data));
            }
        ).on("error", reject);
    });
}

async function getLicences({ tenantId, clientId, clientSecret }) {

    // Parse CSV and normalize headers
    const csvRaw = await fetchSkuCsv();
    const csvData = parse(csvRaw, {
        columns: header => header.map(h => h.replace(/^\uFEFF/, "").trim()),
        trim: true
    });

    // Normalize row keys + values
    const normalizedCsv = csvData.map(row => {
        const clean = {};
        for (const [key, value] of Object.entries(row)) {
            clean[key.replace(/^\uFEFF/, "").trim()] =
                typeof value === "string" ? value.trim() : value;
        }
        return clean;
    });

    const graph = createGraphClient(tenantId, clientId, clientSecret);

    // Get all SKUs
    const skus = await graph.api("https://graph.microsoft.com/v1.0/subscribedSkus").get();

    const results = [];

    for (const sku of skus.value) {

        // Find friendly name in CSV
        const match = normalizedCsv.find(item =>
            item.String_Id === sku.skuPartNumber
        );

        const friendlyName = match
            ? match.Product_Display_Name
            : sku.skuPartNumber;

        const total = sku.prepaidUnits?.enabled || 0;
        const used = sku.consumedUnits || 0;

        // Get users assigned to this licence
        const usersResp = await graph
            .api("https://graph.microsoft.com/v1.0/users")
            .filter(`assignedLicenses/any(x:x/skuId eq ${sku.skuId})`)
            .select("id,displayName,userPrincipalName")
            .get();

        const users = usersResp.value.map(u => ({
            displayName: u.displayName,
            upn: u.userPrincipalName
        }));

        results.push({
            friendlyName,
            skuPartNumber: sku.skuPartNumber,
            skuId: sku.skuId,
            totalLicenses: total,
            usedLicenses: used,
            availableLicenses: total - used,
            users
        });
    }

    return results;
}

module.exports = getLicences;

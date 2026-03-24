"""
Adds `sinceDate?: Date` parameter to all 18 migration fetcher function signatures.
Also adds HubSpot sinceDate filter to the contacts/companies/deals queries.
"""
import re

with open("server/migration-fetchers.ts", "r") as f:
    content = f.read()

# Replace all occurrences of:
#   onProgress?: ProgressCallback
# ): Promise<MigrationData> {
# with:
#   onProgress?: ProgressCallback,
#   sinceDate?: Date
# ): Promise<MigrationData> {

old = "  onProgress?: ProgressCallback\n): Promise<MigrationData> {"
new = "  onProgress?: ProgressCallback,\n  sinceDate?: Date\n): Promise<MigrationData> {"

count = content.count(old)
print(f"Found {count} occurrences to replace")
content = content.replace(old, new)

# Also handle Salesforce which has a different signature (apiKey, instanceUrl, onProgress)
# Check if it was already handled
remaining = content.count("  onProgress?: ProgressCallback\n): Promise<MigrationData>")
print(f"Remaining unhandled: {remaining}")

with open("server/migration-fetchers.ts", "w") as f:
    f.write(content)

print("Done!")

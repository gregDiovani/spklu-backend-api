export function mapProviderToInternalStatus(providerStatus: string): string | null {
    switch (providerStatus) {
        case "COMPLETED":
        case "SUCCEEDED":
            return "PAID";

        case "ACTIVE":
        case "PENDING":
            return "PENDING";

        case "EXPIRED":
            return "EXPIRED";

        case "FAILED":
            return "FAILED";

        default:
            return null; // status tidak dikenal → jangan update internal
    }
}
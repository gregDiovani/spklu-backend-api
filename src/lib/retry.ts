// utils/retry.ts
type RetryOptions = {
    attempts?: number;
    delayMs?: number;
    shouldRetry?: (err: any) => boolean;
};

export async function retry<T>(
    fn: () => Promise<T>,
    {
        attempts = 3,
        delayMs = 500,
        shouldRetry = () => true,
    }: RetryOptions = {}
): Promise<T> {
    let lastErr: any;

    for (let i = 1; i <= attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;

            // ⛔ jangan retry kalau tidak memenuhi syarat
            if (!shouldRetry(err) || i === attempts) {
                break;
            }

            // exponential backoff
            await new Promise((r) => setTimeout(r, delayMs * i));
        }
    }

    throw lastErr;
}

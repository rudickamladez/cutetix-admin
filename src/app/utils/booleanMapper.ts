export function mapBoolean(v: string | number | null): boolean {
    if (typeof v === "string") {
        return ['true', '1', 'yes', 'y', 'on'].includes(v);
    }
    return Boolean(v);
}

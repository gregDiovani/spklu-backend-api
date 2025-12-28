export type Merchant = {
    merchant_id: string;
    merchant_name: string;

    address: string | null;
    phone: string | null;

    meta: any | null; // nanti bisa ketatkan kalau JSON schema jelas

    created_by: string | null;
    created_at: Date;

    updated_at: Date | null;
    updated_by: string | null;

    deleted_at: Date | null;
    deleted_by: string | null;

    photo_url: string | null;
    latitude: number | null;
    longitude: number | null;
};
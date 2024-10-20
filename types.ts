export interface ValidationResponse {
    password: string;
    isValid: boolean;
}

export interface Output {
    site: string;
    breached_password: string;
    password_strength: number;
    first_seen: Date;
}

export interface ValidatedRequest {
    password: string;
    isValid: boolean;
}
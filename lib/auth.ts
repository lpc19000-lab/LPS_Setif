import { SignJWT, jwtVerify } from "jose";

export const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("JWT_SECRET environment variable is not set");
        }
        return new TextEncoder().encode("development_only_secret_12345678");
    }
    return new TextEncoder().encode(secret);
};

export async function signJwtToken(payload: Record<string, unknown>) {
    try {
        const secret = getJwtSecretKey();
        return await new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(secret);
    } catch (error) {
        console.error("JWT sign error:", error);
        throw error;
    }
}

export async function verifyJwtToken(token: string) {
    try {
        const secret = getJwtSecretKey();
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}

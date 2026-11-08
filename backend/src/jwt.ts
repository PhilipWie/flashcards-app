import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
    throw new Error('JWT_SECRET not set');
}
const secret = new TextEncoder().encode(rawSecret);

const ALG = 'HS256';
const TOKEN_LIFETIME = '30m';

// signs a token with the user id as subject
export async function signToken(userId: string | number): Promise<string> {
    return new SignJWT({})
        .setProtectedHeader({ alg: ALG })
        .setSubject(String(userId))
        .setIssuedAt()
        .setExpirationTime(TOKEN_LIFETIME)
        .sign(secret);
}

// verifies signature + expiry, returns the user id (subject). Throws on invalid token
export async function verifyToken(token: string): Promise<string> {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
    if (!payload.sub) {
        throw new Error('Token has no subject');
    }
    return payload.sub;
}

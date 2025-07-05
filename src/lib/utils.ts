import jwt from "jsonwebtoken"

export const generateTokens = (payload: string) => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        const token = jwt.sign({ userId: payload }, secret, { expiresIn: "7d" });
        return token;

    } catch (error) {
        throw new Error(`Failed to generate Error:${error}`)
    }

}
import { error } from "console";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { z } from "zod";
import { success } from "zod/v4";

const PayloadSchema = z.object({
    userId: z.number()
});

export const auth = (request: Request, response: Response, next: NextFunction) => {
    try {
        // console.log("request:",request)
        console.log("Inside Auth route")
        console.log(request.cookies)
        const token = request.cookies.token;
        console.log("token from auth :", token)
        if (!token) {
            console.log("Token not Found")
            response.status(401).json({
                success: false,
                isAuthorized: false,
                error: "Unauthorized"
            })
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.log('JWT_SECRET is missing')
            response.status(401).json({
                success: false,
                isAuthorized: false,
                error: "Unauthorized"
            })
            return;
        }
        const parsed = jwt.verify(token, secret);
        console.log("Parsed:", parsed)
        const result = PayloadSchema.safeParse(parsed);
        console.log("Results:::", result)
        if (!result.success) {
            response.status(401).json({
                success: false,
                isAuthorized: false,
                error: "Invalid token payload"
            })
            return;
        }
        const userId = result.data.userId;
        request.userId = userId;
        response.isAuthorized = true;
        console.log("AUthorisation Successful")
        next();
    } catch (error) {
        console.log(error)
        response.status(401).json({
            success: false,
            isAuthorized: false,
            error: "Unauthorized"
        })
        return;
    }
}
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { generateTokens } from "../lib/utils";
import { pgClient } from "../lib/db";

interface SignupRequestBody {
    full_name: string;
    email: string;
    password: string;
}
export const signup = async (
    request: Request<{}, {}, SignupRequestBody>,
    response: Response
) => {
    try {
        const { full_name, email, password } = request.body;

        if (!full_name || !email || !password) {
            response.status(400).json({
                success: false,
                error: 'All fields are Required'
            });
            return;
        }

        if (password.length < 6) {
            response.status(400).json({
                success: false,
                error: 'Password should be at least 6 characters long'
            });
            return;
        }

        const foundUser = await pgClient.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (foundUser.rows.length > 0) {
            response.status(400).json({
                success: false,
                error: "User already exists"
            });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const insertResult = await pgClient.query(
            'INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id',
            [full_name, email, hashedPassword]
        );
        const userId = insertResult.rows[0]?.id;
        if (!userId) {
            response.status(500).json({
                success: false,
                error: 'User created but could not retrieve user ID.'
            });
            return;
        }

        const token = generateTokens(userId);

        response.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite:'none',
            secure: process.env.NODE_ENV !== "development",
        });

        response.status(201).json({
            success: true,
            message: 'User created successfully'
        });
        return;
    } catch (error) {
        // console.log(error)/
        response.status(500).json({
            success: false,
            error: `Error adding user`
        });
        return;
    }
};

export const signin = async (request: Request, response: Response) => {
    try {
        const { email, password } = request.body;

        if (!email || !password) {
            response.status(400).json({
                success: false,
                error: "All fields are required"
            });
            return;
        }

        // Fetch user by email
        const userResult = await pgClient.query(
            'SELECT id, password FROM users WHERE email = $1',
            [email]
        );
        if (userResult.rowCount === 0) {
            response.status(400).json({
                success: false,
                error: "Invalid credentials"
            });
            return;
        }

        const user = userResult.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            response.status(400).json({
                success: false,
                error: "Invalid credentials"
            });
            return;
        }

        const token = generateTokens(user.id);
        response.cookie("token", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite:'none',
            secure: process.env.NODE_ENV !== "development",
            // secure:false
        });
        // console.log("TOKEN:",token)
        // console.log("response.cookie:",response.cookie)
        // response.on('finish', () => {
        //     console.log('Set-Cookie header:', response.getHeader('Set-Cookie'));
        // });
        
        response.status(200).json({
            success: true,
            message: "User signed in successfully"
        });
        // console.log("User signed in Successfully")
        return;
    } catch (error) {
        console.error('Error in signin:', error);
        response.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};

export const signout = async (request: Request, response: Response) => {
    try {
        response.cookie("token", "", {
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
        });

        response.status(200).json({
            success: true,
            message: "Signed out successfully"
        });
        return;
    } catch (error) {
        console.error('Error in signout:', error);
        response.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};

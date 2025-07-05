import { Request, Response } from "express";
import { pgClient } from "../lib/db";

export const registerCompany = async (request: Request, response: Response) => {
    try {
        const userId = request.userId;
        const { name, industry, description, logo_url } = request.body;

        if (!userId) {
            response.status(401).json({
                success: false,
                error: "Unauthorized"
            });
            return;
        }

        if (!name || !industry) {
            response.status(400).json({
                success: false,
                error: "Name and industry are required."
            });
            return;
        }

        // Check if company already exists for this user
        const existing = await pgClient.query(
            "SELECT id FROM companies WHERE user_id = $1",
            [userId]
        );
        if ((existing.rowCount ?? 0) > 0) {
            response.status(400).json({
                success: false,
                error: "Company already registered for this user."
            });
            return;
        }

        // Insert new company
        const insertResult = await pgClient.query(
            `INSERT INTO companies (user_id, name, industry, description, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, name, industry, description || '', logo_url || '']
        );
        const company = insertResult.rows[0];
        response.status(201).json({
            success: true,
            data: company,
            message: "Registration successful!"
        });
        return;
    } catch (error) {
        console.error("Error registering company:", error);
        response.status(500).json({
            success: false,
            error: "Registration failed."
        });
        return;
    }
};

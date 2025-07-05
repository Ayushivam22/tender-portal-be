import { Request, Response } from "express";
import { pgClient } from "../lib/db";
import { number } from "zod/v4";

export const dashboard = async (request: Request, response: Response) => {

    // console.log("reached controller :::: ")
    const { userId } = request;
    // console.log("User id :")
    // console.log(userId)
    if (!userId) {
        response.status(401).json({
            success: false,
            error: "Unauthorized"
        })
        return;
    }
    try {

        // find user details
        const res = await pgClient.query("SELECT * FROM companies WHERE user_id=$1", [userId]);
        if (res.rowCount == 0) {
            response.status(200).json({
                success: true,
                isCompanyRegistered: false,
                data: null,
                message: "Company not registered"
            })
            return;
        }
        console.log("Printing the rowss:::",res.rows);
        response.status(200).json({
            success: true,
            data: res.rows[0],
            isCompanyRegistered: true,
            message: "Company data fetched Successfully"
        })
        return;
    } catch (error) {
        console.log("error fetching company data:", error)
        response.status(400).json({
            success: false,
            isCompanyRegistered: false,
            error: "Cannot fetch company data"
        })
    }

}
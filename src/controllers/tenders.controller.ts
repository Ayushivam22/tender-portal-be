import { Request, Response } from "express";
import { pgClient } from "../lib/db";

// GET /api/v1/tenders
export const getAllTenders = async (request: Request, response: Response): Promise<void> => {
    try {
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }

        // Get the user's company id
        const companyRes = await pgClient.query(
            "SELECT id FROM companies WHERE user_id = $1",
            [userId]
        );
        if (companyRes.rowCount === 0) {
            response.status(400).json({ success: false, error: "Company not found for user." });
            return;
        }
        const companyId = companyRes.rows[0].id;

        // Get all tenders
        const tendersRes = await pgClient.query("SELECT * FROM tenders");
        const tenders = tendersRes.rows;

        // Get all applications for this company
        const applicationsRes = await pgClient.query(
            "SELECT * FROM applications WHERE company_id = $1",
            [companyId]
        );
        const applications = applicationsRes.rows;

        // Applied tenders: tenders this company has applied to
        const appliedTenderIds = new Set(applications.map(app => app.tender_id));
        const applied = tenders.filter(tender => appliedTenderIds.has(tender.id));

        // Allocated tenders: tenders this company has been awarded (is_awarded = true)
        const allocatedTenderIds = new Set(
            applications.filter(app => app.is_awarded).map(app => app.tender_id)
        );
        const allocated = tenders.filter(tender => allocatedTenderIds.has(tender.id));

        // Available tenders: tenders this company has NOT applied to
        const available = tenders.filter(tender => !appliedTenderIds.has(tender.id));

        response.status(200).json({
            applied,
            allocated,
            available
        });
        return;
    } catch (error) {
        console.error("Error fetching tenders:", error);
        response.status(500).json({ success: false, error: "Failed to fetch tenders." });
        return;
    }
};

// POST /api/v1/tenders/:tenderId/apply
export const applyForTender = async (request: Request, response: Response): Promise<void> => {
    try {
        const userId = request.userId;
        const { tenderId } = request.params;
        if (!userId) {
            response.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }
        // Get company id
        const companyRes = await pgClient.query(
            "SELECT id FROM companies WHERE user_id = $1",
            [userId]
        );
        if ((companyRes.rowCount ?? 0) === 0) {
            response.status(400).json({ success: false, error: "Company not found for user." });
            return;
        }
        const companyId = companyRes.rows[0].id;
        // Check if already applied
        const existing = await pgClient.query(
            "SELECT id FROM applications WHERE company_id = $1 AND tender_id = $2",
            [companyId, tenderId]
        );
        if ((existing.rowCount ?? 0) > 0) {
            response.status(400).json({ success: false, error: "Already applied to this tender." });
            return;
        }
        // Insert application
        await pgClient.query(
            "INSERT INTO applications (company_id, tender_id, proposal) VALUES ($1, $2, $3)",
            [companyId, tenderId, ""]
        );
        response.status(201).json({ success: true, message: "Applied to tender successfully." });
    } catch (error) {
        console.error("Error applying for tender:", error);
        response.status(500).json({ success: false, error: "Failed to apply for tender." });
    }
};

// DELETE /api/v1/tenders/:tenderId/cancel
export const cancelTenderApplication = async (request: Request, response: Response): Promise<void> => {
    try {
        const userId = request.userId;
        const { tenderId } = request.params;
        if (!userId) {
            response.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }
        // Get company id
        const companyRes = await pgClient.query(
            "SELECT id FROM companies WHERE user_id = $1",
            [userId]
        );
        if ((companyRes.rowCount ?? 0) === 0) {
            response.status(400).json({ success: false, error: "Company not found for user." });
            return;
        }
        const companyId = companyRes.rows[0].id;
        // Delete application
        const result = await pgClient.query(
            "DELETE FROM applications WHERE company_id = $1 AND tender_id = $2 RETURNING *",
            [companyId, tenderId]
        );
        if ((result.rowCount ?? 0) === 0) {
            response.status(404).json({ success: false, error: "Application not found." });
            return;
        }
        response.status(200).json({ success: true, message: "Tender application cancelled." });
    } catch (error) {
        console.error("Error cancelling tender application:", error);
        response.status(500).json({ success: false, error: "Failed to cancel tender application." });
    }
};

// POST /api/v1/tenders (create a new tender)
export const createTender = async (request: Request, response: Response): Promise<void> => {
    try {
        const userId = request.userId;
        const { title, description, deadline, budget } = request.body;
        if (!userId) {
            response.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }
        if (!title || !deadline) {
            response.status(400).json({ success: false, error: "Title and deadline are required." });
            return;
        }
        // Get company id
        const companyRes = await pgClient.query(
            "SELECT id FROM companies WHERE user_id = $1",
            [userId]
        );
        if ((companyRes.rowCount ?? 0) === 0) {
            response.status(400).json({ success: false, error: "Company not found for user." });
            return;
        }
        const companyId = companyRes.rows[0].id;
        // Insert tender
        const insertResult = await pgClient.query(
            `INSERT INTO tenders (company_id, title, description, deadline, budget) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [companyId, title, description || '', deadline, budget || null]
        );
        response.status(201).json({ success: true, data: insertResult.rows[0], message: "Tender created successfully." });
    } catch (error) {
        console.error("Error creating tender:", error);
        response.status(500).json({ success: false, error: "Failed to create tender." });
    }
};

// PUT /api/v1/tenders/:tenderId (update a tender)
export const updateTender = async (request: Request, response: Response): Promise<void> => {
    try {
        const userId = request.userId;
        const { tenderId } = request.params;
        const { title, description, deadline, budget } = request.body;
        if (!userId) {
            response.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }
        // Get company id
        const companyRes = await pgClient.query(
            "SELECT id FROM companies WHERE user_id = $1",
            [userId]
        );
        if ((companyRes.rowCount ?? 0) === 0) {
            response.status(400).json({ success: false, error: "Company not found for user." });
            return;
        }
        const companyId = companyRes.rows[0].id;
        // Only allow update if this company owns the tender
        const tenderRes = await pgClient.query(
            "SELECT * FROM tenders WHERE id = $1 AND company_id = $2",
            [tenderId, companyId]
        );
        if ((tenderRes.rowCount ?? 0) === 0) {
            response.status(403).json({ success: false, error: "Not authorized to update this tender." });
            return;
        }
        // Update tender
        const updateResult = await pgClient.query(
            `UPDATE tenders SET title = $1, description = $2, deadline = $3, budget = $4 WHERE id = $5 RETURNING *`,
            [title, description, deadline, budget, tenderId]
        );
        response.status(200).json({ success: true, data: updateResult.rows[0], message: "Tender updated successfully." });
    } catch (error) {
        console.error("Error updating tender:", error);
        response.status(500).json({ success: false, error: "Failed to update tender." });
    }
};

// DELETE /api/v1/tenders/:tenderId (delete/cancel a tender)
export const deleteTender = async (request: Request, response: Response): Promise<void> => {
    try {
        const userId = request.userId;
        const { tenderId } = request.params;
        if (!userId) {
            response.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }
        // Get company id
        const companyRes = await pgClient.query(
            "SELECT id FROM companies WHERE user_id = $1",
            [userId]
        );
        if ((companyRes.rowCount ?? 0) === 0) {
            response.status(400).json({ success: false, error: "Company not found for user." });
            return;
        }
        const companyId = companyRes.rows[0].id;
        // Only allow delete if this company owns the tender
        const tenderRes = await pgClient.query(
            "SELECT * FROM tenders WHERE id = $1 AND company_id = $2",
            [tenderId, companyId]
        );
        if ((tenderRes.rowCount ?? 0) === 0) {
            response.status(403).json({ success: false, error: "Not authorized to delete this tender." });
            return;
        }
        // Delete tender
        await pgClient.query(
            "DELETE FROM tenders WHERE id = $1",
            [tenderId]
        );
        response.status(200).json({ success: true, message: "Tender deleted successfully." });
    } catch (error) {
        console.error("Error deleting tender:", error);
        response.status(500).json({ success: false, error: "Failed to delete tender." });
    }
};

// GET /api/v1/tenders/:tenderId (get a single tender)
export const getTender = async (request: Request, response: Response): Promise<void> => {
    try {
        const { tenderId } = request.params;
        const tenderRes = await pgClient.query(
            "SELECT * FROM tenders WHERE id = $1",
            [tenderId]
        );
        if ((tenderRes.rowCount ?? 0) === 0) {
            response.status(404).json({ success: false, error: "Tender not found." });
            return;
        }
        response.status(200).json({ success: true, data: tenderRes.rows[0] });
    } catch (error) {
        console.error("Error fetching tender:", error);
        response.status(500).json({ success: false, error: "Failed to fetch tender." });
    }
};

// GET /api/v1/tenders/my
export const getMyTenders = async (request: Request, response: Response): Promise<void> => {
    try {
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({ success: false, error: "Unauthorized" });
            return;
        }
        // Get company id
        const companyRes = await pgClient.query(
            "SELECT id FROM companies WHERE user_id = $1",
            [userId]
        );
        if ((companyRes.rowCount ?? 0) === 0) {
            response.status(400).json({ success: false, error: "Company not found for user." });
            return;
        }
        const companyId = companyRes.rows[0].id;
        // Get all tenders created by this company
        const tendersRes = await pgClient.query(
            "SELECT * FROM tenders WHERE company_id = $1 ORDER BY created_at DESC",
            [companyId]
        );
        response.status(200).json({ success: true, myTenders: tendersRes.rows });
    } catch (error) {
        console.error("Error fetching my tenders:", error);
        response.status(500).json({ success: false, error: "Failed to fetch your tenders." });
    }
};

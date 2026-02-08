import { getAuth } from "@clerk/express";
import sql from "../configs/db.js";
import { Request, Response } from "express";

export const getUserCreations = async (req: Request, res: Response) => {
    try {
        const {userId} = getAuth(req);

        const creations = await sql`SELECT * FROM creations WHERE user_id = ${userId} order BY created_at DESC`;     

        if(creations.length === 0) {
            return res.status(404).send("No creations found for this user.");
        }

        res.status(200).json({ success: true, creations });
    } catch (error) {
        res.status(500).send("An error occurred while fetching creations.");
    }
}

export const getPublishedCreations = async (req: Request, res: Response) => {
    try {
        const creations = await sql`
            SELECT * FROM creations WHERE publish = true order BY created_at DESC`;     

        res.status(200).json({ success: true, creations });
    } catch (error) {
        res.status(500).send("An error occurred while fetching creations.");
    }
}

export const toggleLikeCreation = async (req: Request, res: Response) => {
    try {

        const {userId} = getAuth(req);
        const {creationId} = req.params;

        // Fetch the creation to get current likes
        const [creation] = await sql`SELECT * FROM creations WHERE id = ${creationId}`

        // get all published creations
        const creations = await sql`
            SELECT * FROM creations WHERE publish = true order BY created_at DESC`;     

        if(!creations) {
            return res.status(404).send("Creations not found for this user.");
        }

        const currentLikes: string[] = creation.likes ?? [];
        const userIdStr = userId?.toString() || "";

        let updatedLikes: string[];
        let message: string;

        // Toggle like/unlike
        if(currentLikes.includes(userIdStr)) {
            // When unliking, remove userId from likes array
            updatedLikes = currentLikes.filter((id) => id !== userIdStr);
            message = "Creation unliked.";
        } else {
            // When liking, add userId to likes array
            updatedLikes = [...currentLikes, userIdStr];
            message = "Creation liked.";
        }

        // Format the array for PostgreSQL so it recognizes it as a text[]
        const formattedArrays = `{${updatedLikes.map((id) => `"${id}"`).join(",")}}`;

        // Update the creation with the new likes array
        await sql`UPDATE creations SET likes = ${formattedArrays}::text[] WHERE id = ${creationId}`;

        res.status(200).json({ success: true, message });
    } catch (error) {
        res.status(500).send("An error occurred while fetching creations.");
    }
}

export const togglePublishCreation = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        const { creationId, publish } = req.body;

        if (!creationId || typeof publish !== 'boolean') {
            return res.status(400).json({ success: false, message: 'creationId and publish(boolean) are required' });
        }

        // Verify the creation belongs to the user
        const [creation] = await sql`SELECT * FROM creations WHERE id = ${creationId}`;
        if (!creation) {
            return res.status(404).json({ success: false, message: 'Creation not found' });
        }

        if (creation.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to modify this creation' });
        }

        await sql`UPDATE creations SET publish = ${publish} WHERE id = ${creationId}`;

        res.status(200).json({ success: true, creationId, publish });
    } catch (error) {
        console.error('togglePublishCreation error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle publish state' });
    }
}
import { NextFunction, Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";

/**
 * Middleware to check userId and hasPremiumPlan in the request.
 * It also synchronizes user usage metadata and sets request-level plan info.
 */
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authData = getAuth(req);
    const { userId, has } = authData;

    // If no userId, return 401 Unauthorized
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Clerk's has() check usually checks for organization roles/permissions or feature flags.
    // In some versions, 'has' is synchronous. We use it to check for 'premium' plan.
    const hasPremiumPlan = has({ plan: "premium" } as any);

    // Fetch user metadata to get free_usage count
    const user = await clerkClient.users.getUser(userId);
    const privateMetadata = user.privateMetadata as { free_usage?: number };

    // Set free_usage in request based on plan and metadata
    if (!hasPremiumPlan && typeof privateMetadata.free_usage === "number" && privateMetadata.free_usage > 0) {
      // User is on free plan and has remaining usage
      req.free_usage = privateMetadata.free_usage;
    } else {
      // User is either premium or has no free usage left.
      // Reset free_usage to 0 in metadata if it's not already 0 or unset.
      if (privateMetadata.free_usage !== 0) {
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: { free_usage: 0 },
        });
      }
      req.free_usage = 0;
    }

    // Set plan info in request for further processing
    req.plan = hasPremiumPlan ? "premium" : "free";
    next();

  } catch (error: unknown) {
    console.error("Auth middleware error:", error);
    const errorMessage = error instanceof Error ? error.message : "Authentication failed";
    res.status(401).json({ success: false, message: errorMessage });
  }
};

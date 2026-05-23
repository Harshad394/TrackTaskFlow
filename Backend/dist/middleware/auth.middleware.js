import jwt from "jsonwebtoken";
export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : undefined;
        const token = req.cookies?.accessToken || bearerToken;
        if (!token) {
            return res.status(401).json({ message: "Authentication token missing" });
        }
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            return res.status(500).json({ message: "JWT access secret not configured" });
        }
        const decoded = jwt.verify(token, secret);
        if (!decoded.userId) {
            return res.status(401).json({ message: "Invalid authentication token" });
        }
        req.user = { userId: decoded.userId };
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

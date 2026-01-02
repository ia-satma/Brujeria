import { Request, Response, NextFunction } from "express";

/**
 * Token Guard Utility
 * Truncates long inputs to prevent MAX_TOKENS_EXCEEDED errors.
 * Preserves document structure by keeping Head, Body Start, and Footer.
 */

const MAX_CHARS = 15000;
const FOOTER_SIZE = 2000;
const HEAD_SIZE = 3000;

/**
 * Intelligently truncates text while preserving structure.
 */
export function truncateContent(content: string): string {
    if (content.length <= MAX_CHARS) {
        return content;
    }

    const originalSize = content.length;
    const middleSize = MAX_CHARS - HEAD_SIZE - FOOTER_SIZE - 100; // 100 char buffer for note

    const head = content.slice(0, HEAD_SIZE);
    const footer = content.slice(-FOOTER_SIZE);
    const middle = content.slice(HEAD_SIZE, HEAD_SIZE + middleSize);

    const truncated = `${head}\n\n[...SYSTEM: CONTENT TRUNCATED FOR SAFETY - Original size: ${originalSize} chars...]\n\n${middle}\n\n[...CONTINUED...]\n\n${footer}\n\n[...SYSTEM: END OF TRUNCATED CONTENT...]`;

    console.warn(`[Security] Input truncated from ${originalSize} to 15000 chars.`);

    return truncated;
}

/**
 * Express Middleware for Token Guarding
 */
export function tokenGuardMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body.content === "string") {
        req.body.content = truncateContent(req.body.content);
    } else if (req.body && typeof req.body.html === "string") {
        req.body.html = truncateContent(req.body.html);
    }
    next();
}

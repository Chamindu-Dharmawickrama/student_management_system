import crypto from "crypto";
import { getPrisma } from "../config/database.js";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O — avoids look-alike chars
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SPECIAL = "!@#$%^&*-_+=";
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

const randomChar = (charset) => charset[crypto.randomInt(charset.length)];

// Shuffles in place using Fisher-Yates with a CSPRNG.
function shuffle(chars) {
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars;
}

// Generates a random one-time password (never derived from name, admission
// number, employee number, DOB, email, or any other guessable data — §17).
// Guarantees at least one char from each required class so it always
// satisfies the same strongPassword policy enforced on auth.validator.js.
export const generateTemporaryPassword = (length = 12) => {
    const required = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SPECIAL)];
    const rest = Array.from({ length: length - required.length }, () => randomChar(ALL));
    return shuffle([...required, ...rest]).join("");
};

const sanitizeToUsername = (source) =>
    source
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 20) || "user";

// Derives a username from a school-assigned identifier (admission number for
// students, employee number for teachers — see schema.prisma User.username
// comment) and guarantees it is free by checking the DB, appending a random
// 4-digit suffix on collision.
export const generateUniqueUsername = async (source) => {
    const base = sanitizeToUsername(source);
    const db = getPrisma();

    const taken = await db.user.findUnique({ where: { username: base }, select: { id: true } });
    if (!taken) return base;

    for (let i = 0; i < 10; i++) {
        const suffix = crypto.randomInt(1000, 10000);
        const candidate = `${base.slice(0, 15)}_${suffix}`;
        const exists = await db.user.findUnique({ where: { username: candidate }, select: { id: true } });
        if (!exists) return candidate;
    }

    // Extremely unlikely to reach here, but ensures we never throw.
    return `${base.slice(0, 13)}_${Date.now().toString().slice(-6)}`;
};

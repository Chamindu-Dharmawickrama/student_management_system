import bcrypt from "bcrypt";
import { getPrisma, disconnectDatabase } from "../src/config/database.js";
import { config } from "../src/config/env.js";
import { logger } from "../src/config/logger.js";

const SALT_ROUNDS = 12;

// Bootstraps the very first SCHOOL_ADMIN account. There is no public
// self-registration endpoint in this system (§23/§35) — only an admin can
// register students/teachers — so the first admin has to come from
// somewhere outside the HTTP API. Idempotent: does nothing if a
// SCHOOL_ADMIN already exists, so it's safe to run on every deploy.
async function seedAdmin() {
    const db = getPrisma();

    const existingAdmin = await db.user.findFirst({
        where: { role: "SCHOOL_ADMIN" },
        select: { id: true },
    });

    if (existingAdmin) {
        logger.info("[seed] A SCHOOL_ADMIN already exists — skipping admin seed.");
        return;
    }

    if (!config.seedAdminEmail || !config.seedAdminUsername || !config.seedAdminPassword) {
        logger.warn(
            "[seed] No SCHOOL_ADMIN exists and SEED_ADMIN_EMAIL / SEED_ADMIN_USERNAME / " +
            "SEED_ADMIN_PASSWORD are not set — skipping. Set them in .env and re-run " +
            "`npx prisma db seed` to bootstrap the first admin account.",
        );
        return;
    }

    const passwordHash = await bcrypt.hash(config.seedAdminPassword, SALT_ROUNDS);

    const admin = await db.user.create({
        data: {
            username: config.seedAdminUsername,
            email: config.seedAdminEmail,
            password: passwordHash,
            role: "SCHOOL_ADMIN",
            // Forced to change the seeded password on first login, same as
            // any other admin-provisioned account (BR-25/FR-022).
            mustChangePassword: true,
            firstName: config.seedAdminFirstName,
            lastName: config.seedAdminLastName,
        },
    });

    logger.info(`[seed] Created initial SCHOOL_ADMIN account: ${admin.username} <${admin.email}>`);
}

seedAdmin()
    .catch((err) => {
        logger.error("[seed] Failed to seed the initial admin account.", { message: err.message });
        process.exitCode = 1;
    })
    .finally(async () => {
        await disconnectDatabase();
    });

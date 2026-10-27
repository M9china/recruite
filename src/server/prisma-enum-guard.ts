/**
 * Compile-time guard: fails `npm run typecheck` if the Prisma enum and the
 * domain list in src/lib/domain/application-status.ts ever diverge.
 */
import type { $Enums } from "@prisma/client";
import type { ApplicationStatus } from "@/lib/domain/application-status";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export const applicationStatusInSync: Equal<$Enums.ApplicationStatus, ApplicationStatus> = true;

import { useMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { PARKING_SERVER_SYNC } from "@repo/shared";

/**
 * useMutation for parking and preference sync. While PARKING_SERVER_SYNC is off
 * (the default), it resolves without calling the server, so the parked car stays
 * on this device as the privacy policy promises.
 */
export function useSyncMutation<Mutation extends FunctionReference<"mutation">>(mutation: Mutation) {
    const remote = useMutation(mutation);
    if (PARKING_SERVER_SYNC) return remote;
    return (async () => null) as unknown as typeof remote;
}

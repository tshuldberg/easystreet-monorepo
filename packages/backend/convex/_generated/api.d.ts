/* eslint-disable */
/**
 * Stub types for Convex API — replaced by `npx convex dev` codegen.
 * Provides enough type information for apps to typecheck before deployment.
 */
import type { FunctionReference } from "convex/server";

type QueryRef = FunctionReference<"query">;
type MutationRef = FunctionReference<"mutation">;
type ActionRef = FunctionReference<"action">;

interface Api {
    streets: {
        getSegmentsInBounds: QueryRef;
        getSegmentsPage: QueryRef;
        getSegmentById: QueryRef;
        searchStreets: QueryRef;
        findNearestSegment: QueryRef;
    };
    parking: {
        getParkedCar: QueryRef;
        parkCar: MutationRef;
        updateParkedLocation: MutationRef;
        clearParkedCar: MutationRef;
    };
    preferences: {
        getPreferences: QueryRef;
        setPreferences: MutationRef;
    };
    seed: {
        seedFromCSV: ActionRef;
    };
}

interface Internal {
    seed: {
        insertBatch: FunctionReference<"mutation", "internal">;
    };
}

declare const api: Api;
declare const internal: Internal;
export { api, internal };

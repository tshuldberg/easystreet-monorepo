/* eslint-disable */
/**
 * Runtime references use Convex's generated API implementation even before a
 * deployment is configured. `npx convex dev` refreshes the paired type surface.
 */
import { anyApi } from "convex/server";

export const api = anyApi;
export const internal = anyApi;

import assert from "node:assert/strict";
import test from "node:test";
import { getFunctionName } from "convex/server";
import { api, internal } from "../convex/_generated/api.js";

test("checked-in API references work before backend deployment", () => {
  assert.equal(getFunctionName(api.streets.getSegmentsInBounds), "streets:getSegmentsInBounds");
  assert.equal(getFunctionName(api.parking.parkCar), "parking:parkCar");
  assert.equal(getFunctionName(internal.seed.insertBatch), "seed:insertBatch");
});

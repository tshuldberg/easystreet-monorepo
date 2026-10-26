import { describe, expect, it } from "vitest";
import { hourToTime, parseScheduleCSV, splitCSV } from "./scheduleParser";

const HEADER =
    "CNN,Corridor,Limits,CNNRightLeft,BlockSide,FullName,WeekDay,FromHour,ToHour,Week1,Week2,Week3,Week4,Week5,Holidays,BlockSweepID,Line";
const LINE = '"LINESTRING (-122.416291701103 37.777493843394, -122.417501462483 37.776540893509)"';
const CSV = [
    HEADER,
    `8753101,Market St,Larkin St  -  Polk St,L,SouthEast,Tuesday,Tues,5,6,1,1,1,1,1,0,1640782,${LINE}`,
    `8753101,Market St,Larkin St  -  Polk St,L,SouthEast,Saturday,Sat,5,7,1,1,1,1,1,1,1618088,${LINE}`,
    `8753101,Market St,Larkin St  -  Polk St,L,SouthEast,HOLIDAY,Holiday,5,7,1,1,1,1,1,1,1640736,${LINE}`,
    `8753101,Market St,Larkin St  -  Polk St,L,SouthEast,Tuesday,Tues,5,6,1,1,1,1,1,0,1640999,${LINE}`,
    `8508000,Lower Great Hwy,Lincoln Way  -  Irving St,R,West,"Tue 1st, 3rd, 5th",Tues,13,15,1,0,1,0,1,0,1645051,"LINESTRING (-122.509833 37.763969, -122.509622 37.762127)"`,
    `8508000,Lower Great Hwy,Lincoln Way  -  Irving St,R,West,"Thu 2nd & 4th",Thu,7.5,9,0,1,0,1,0,0,1645052,`,
    `9999999,Nowhere St,A St  -  B St,L,,Monday,Mon,8,10,1,1,1,1,1,0,1700000,`,
].join("\r\n");

describe("parseScheduleCSV", () => {
    const { segments, stats } = parseScheduleCSV(CSV);
    const byId = new Map(segments.map((s) => [s.segmentId, s]));

    it("merges every row of a block side into one segment", () => {
        const market = byId.get("8753101-L")!;
        expect(market.rules.map((r) => [r.kind, r.dayOfWeek])).toEqual([
            ["weekly", 3],
            ["weekly", 7],
            ["holiday", 0],
        ]);
        expect(stats.duplicateRules).toBe(1);
        expect(market.limits).toBe("Larkin St - Polk St");
    });

    it("keeps holiday rows as holiday rules", () => {
        expect(stats.holidayRules).toBe(1);
        const holiday = byId.get("8753101-L")!.rules.find((r) => r.kind === "holiday")!;
        expect([holiday.startTime, holiday.endTime, holiday.applyOnHolidays]).toEqual(["05:00", "07:00", true]);
    });

    it("reads week flags, fractional hours and quoted fields", () => {
        const great = byId.get("8508000-R")!;
        expect(great.rules.find((r) => r.dayOfWeek === 3)!.weeksOfMonth).toEqual([1, 3, 5]);
        const thu = great.rules.find((r) => r.dayOfWeek === 5)!;
        expect(thu.weeksOfMonth).toEqual([2, 4]);
        expect(thu.startTime).toBe("07:30");
    });

    it("drops block sides that have no geometry at all", () => {
        expect(byId.has("9999999-L")).toBe(false);
        expect(stats.segmentsWithoutGeometry).toBe(1);
        expect(stats.segments).toBe(2);
    });
});

describe("csv helpers", () => {
    it("handles escaped quotes and CRLF", () => {
        expect(splitCSV('a,"b ""c"", d"\r\n1,2')).toEqual([["a", 'b "c", d'], ["1", "2"]]);
    });

    it("converts hours", () => {
        expect(hourToTime("0")).toBe("00:00");
        expect(hourToTime("7.5")).toBe("07:30");
        expect(() => hourToTime("25")).toThrow();
    });
});

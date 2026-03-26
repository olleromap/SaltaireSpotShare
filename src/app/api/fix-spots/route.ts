import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FLOOR_COUNTS: Record<number, number> = { 1: 36, 2: 64, 3: 72, 4: 73, 5: 73, 6: 73 };

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allSpots = await prisma.parkingSpot.findMany({
    select: { id: true, spotNumber: true, floor: true },
  });

  // Step 1: Fix zero-padded names (R2-01 -> R2-1)
  const padded = allSpots.filter((s) => /^R\d+-0\d/.test(s.spotNumber));
  const existing = new Set(allSpots.map((s) => s.spotNumber));
  let renamed = 0;
  let deletedDup = 0;

  for (const spot of padded) {
    const fixed = spot.spotNumber.replace(/^(R\d+-)0+(\d+)$/, "$1$2");
    if (existing.has(fixed)) {
      await prisma.parkingSpot.delete({ where: { id: spot.id } });
      deletedDup++;
    } else {
      await prisma.parkingSpot.update({ where: { id: spot.id }, data: { spotNumber: fixed } });
      existing.add(fixed);
      existing.delete(spot.spotNumber);
      renamed++;
    }
  }

  // Step 2: Delete spots whose number exceeds the correct count for their floor
  const refresh = await prisma.parkingSpot.findMany({ select: { id: true, spotNumber: true, floor: true } });
  let deletedExtra = 0;

  for (const spot of refresh) {
    const max = FLOOR_COUNTS[spot.floor];
    if (!max) continue;
    const num = parseInt(spot.spotNumber.split("-")[1] ?? "0", 10);
    if (num > max) {
      await prisma.parkingSpot.delete({ where: { id: spot.id } });
      deletedExtra++;
    }
  }

  // Step 3: Create any missing spots
  const afterDelete = await prisma.parkingSpot.findMany({ select: { spotNumber: true } });
  const present = new Set(afterDelete.map((s) => s.spotNumber));
  let created = 0;

  for (const [floorStr, count] of Object.entries(FLOOR_COUNTS)) {
    const floor = Number(floorStr);
    for (let i = 1; i <= count; i++) {
      const spotNumber = `R${floor}-${i}`;
      if (!present.has(spotNumber)) {
        await prisma.parkingSpot.create({ data: { spotNumber, floor, isActive: true } });
        created++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    summary: { renamed, deletedDuplicates: deletedDup, deletedOutOfRange: deletedExtra, created },
  });
}

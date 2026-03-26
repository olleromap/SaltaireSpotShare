import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all spots and check their current state
  const allSpots = await prisma.parkingSpot.findMany({
    select: { id: true, spotNumber: true, floor: true },
  });

  const padded = allSpots.filter((s) => /^R\d+-0\d/.test(s.spotNumber));
  const unpadded = new Set(allSpots.map((s) => s.spotNumber).filter((n) => !/^R\d+-0\d/.test(n)));

  let deleted = 0;
  let renamed = 0;

  for (const spot of padded) {
    const fixed = spot.spotNumber.replace(/^(R\d+-)0+(\d+)$/, "$1$2");
    if (unpadded.has(fixed)) {
      // Unpadded version already exists — delete the padded duplicate
      await prisma.parkingSpot.delete({ where: { id: spot.id } });
      deleted++;
    } else {
      // Safe to rename
      await prisma.parkingSpot.update({
        where: { id: spot.id },
        data: { spotNumber: fixed },
      });
      unpadded.add(fixed);
      renamed++;
    }
  }

  // Also ensure any spots missing the R prefix get it
  const noPrefix = allSpots.filter((s) => !/^R/.test(s.spotNumber));
  let prefixed = 0;
  for (const spot of noPrefix) {
    const fixed = `R${spot.spotNumber}`;
    if (!unpadded.has(fixed)) {
      await prisma.parkingSpot.update({
        where: { id: spot.id },
        data: { spotNumber: fixed },
      });
      prefixed++;
    }
  }

  return NextResponse.json({
    ok: true,
    summary: { paddedFound: padded.length, deleted, renamed, prefixed },
  });
}

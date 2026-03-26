import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const managerHash = await bcrypt.hash("manager123!", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@saltaire.com" },
    update: {},
    create: {
      email: "manager@saltaire.com",
      name: "Property Manager",
      role: "MANAGER",
      unitNumber: "MGMT",
      passwordHash: managerHash,
    },
  });

  const floorSpotCounts: Record<number, number> = { 1: 36, 2: 64, 3: 72, 4: 73, 5: 73, 6: 73 };
  const spotPromises = [];
  for (const [floorStr, count] of Object.entries(floorSpotCounts)) {
    const floor = Number(floorStr);
    for (let i = 1; i <= count; i++) {
      const spotNumber = `${floor}-${String(i).padStart(2, "0")}`;
      spotPromises.push(
        prisma.parkingSpot.upsert({
          where: { spotNumber },
          update: {},
          create: { spotNumber, floor, isActive: true },
        })
      );
    }
  }
  await Promise.all(spotPromises);

  const residentHash = await bcrypt.hash("resident123!", 12);
  const residentData = [
    { email: "alice@example.com", name: "Alice Johnson", unitNumber: "1A" },
    { email: "bob@example.com", name: "Bob Martinez", unitNumber: "2B" },
    { email: "carol@example.com", name: "Carol Williams", unitNumber: "3C" },
    { email: "david@example.com", name: "David Chen", unitNumber: "4A" },
    { email: "emma@example.com", name: "Emma Davis", unitNumber: "5B" },
    { email: "frank@example.com", name: "Frank Wilson", unitNumber: "6C" },
    { email: "grace@example.com", name: "Grace Taylor", unitNumber: "7A" },
    { email: "henry@example.com", name: "Henry Anderson", unitNumber: "8B" },
    { email: "iris@example.com", name: "Iris Thompson", unitNumber: "9C" },
    { email: "jack@example.com", name: "Jack Garcia", unitNumber: "10A" },
  ];

  const residents = [];
  for (const r of residentData) {
    const resident = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { ...r, role: "RESIDENT", passwordHash: residentHash },
    });
    residents.push(resident);
  }

  const spots = await prisma.parkingSpot.findMany({ orderBy: { spotNumber: "asc" }, take: 10 });
  for (let i = 0; i < residents.length; i++) {
    await prisma.parkingSpot.update({
      where: { id: spots[i].id },
      data: { ownerId: residents[i].id },
    });
  }

  return NextResponse.json({ ok: true, message: "Database seeded successfully" });
}

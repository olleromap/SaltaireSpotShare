import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SaltaireSpotShare...");

  // Manager accounts
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
  console.log("✓ Manager account: manager@saltaire.com / manager123!");

  // Create 391 parking spots matching actual Saltaire layout
  console.log("🏗  Creating 391 parking spots...");
  const floorSpotCounts: Record<number, number> = { 1: 36, 2: 64, 3: 72, 4: 73, 5: 73, 6: 73 };
  const spotPromises = [];
  for (const [floorStr, count] of Object.entries(floorSpotCounts)) {
    const floor = Number(floorStr);
    for (let i = 1; i <= count; i++) {
      const spotNumber = `R${floor}-${i}`;
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
  console.log("✓ 391 spots created");

  // Create 20 sample residents
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
    { email: "kate@example.com", name: "Kate Miller", unitNumber: "11B" },
    { email: "liam@example.com", name: "Liam Robinson", unitNumber: "12C" },
    { email: "mia@example.com", name: "Mia Lopez", unitNumber: "13A" },
    { email: "noah@example.com", name: "Noah Harris", unitNumber: "14B" },
    { email: "olivia@example.com", name: "Olivia White", unitNumber: "15C" },
    { email: "peter@example.com", name: "Peter Clark", unitNumber: "16A" },
    { email: "quinn@example.com", name: "Quinn Lewis", unitNumber: "17B" },
    { email: "rose@example.com", name: "Rose Young", unitNumber: "18C" },
    { email: "sam@example.com", name: "Sam Allen", unitNumber: "19A" },
    { email: "tara@example.com", name: "Tara Walker", unitNumber: "20B" },
  ];

  console.log("👥 Creating residents...");
  const residents = [];
  for (const r of residentData) {
    const resident = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { ...r, role: "RESIDENT", passwordHash: residentHash },
    });
    residents.push(resident);
  }
  console.log(`✓ ${residents.length} residents created (password: resident123!)`);

  // Assign spots to residents
  console.log("🅿️  Assigning spots...");
  const spots = await prisma.parkingSpot.findMany({ orderBy: { spotNumber: "asc" }, take: 20 });
  for (let i = 0; i < residents.length; i++) {
    await prisma.parkingSpot.update({
      where: { id: spots[i].id },
      data: { ownerId: residents[i].id },
    });
  }
  console.log("✓ Spots assigned");

  // Create some availability windows
  console.log("📅 Creating availability windows...");
  const today = new Date();
  const availabilities = [
    { daysFromNow: 1, duration: 10 }, // Alice away next week
    { daysFromNow: 3, duration: 7 },  // Bob away
    { daysFromNow: 0, duration: 14 }, // Carol long trip
    { daysFromNow: 5, duration: 5 },
    { daysFromNow: 2, duration: 3 },
    { daysFromNow: 0, duration: 30 }, // Seasonal resident
  ];

  for (let i = 0; i < availabilities.length && i < residents.length; i++) {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + availabilities[i].daysFromNow);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + availabilities[i].duration);

    const spot = await prisma.parkingSpot.findFirst({ where: { ownerId: residents[i].id } });
    if (!spot) continue;

    // Check no conflict first
    const conflict = await prisma.spotAvailability.findFirst({
      where: {
        spotId: spot.id,
        status: { in: ["ACTIVE", "RESERVED"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (conflict) continue;

    await prisma.spotAvailability.create({
      data: {
        spotId: spot.id,
        createdById: residents[i].id,
        startDate,
        endDate,
        notes: i === 5 ? "Seasonal resident — spotless garage spot" : undefined,
      },
    });
  }
  console.log("✓ Availability windows created");

  // Log manager invite link for testing
  const invite = await prisma.invite.create({
    data: {
      email: "newresident@example.com",
      sentById: manager.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`\n📧 Test invite token: ${invite.token}`);
  console.log(`   Register URL: http://localhost:3000/register?token=${invite.token}`);
  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

import { db, deliveryUsersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const SAMPLE_USERS = [
  { username: "driver_ali", password: "pass1234", name: "علي بن عمر", phone: "0551234501", role: "driver" },
  { username: "driver_karim", password: "pass1234", name: "كريم مزياني", phone: "0551234502", role: "driver" },
  { username: "driver_yacine", password: "pass1234", name: "ياسين بوعلام", phone: "0551234503", role: "driver" },
  { username: "driver_nabil", password: "pass1234", name: "نبيل صادق", phone: "0551234504", role: "driver" },
  { username: "driver_farid", password: "pass1234", name: "فريد حمداني", phone: "0551234505", role: "driver" },
  { username: "company_rapid", password: "pass1234", name: "شركة رابيد للتوصيل", phone: "0231234601", role: "company" },
  { username: "company_express", password: "pass1234", name: "الجزائر إكسبريس", phone: "0231234602", role: "company" },
];

// Vary availability for demo purposes
const AVAILABILITY = [true, false, true, true, false, true, false];

export async function seedDeliveryUsers() {
  console.log("Seeding delivery users...");
  for (let i = 0; i < SAMPLE_USERS.length; i++) {
    const u = SAMPLE_USERS[i];
    const existing = await db
      .select()
      .from(deliveryUsersTable)
      .where(eq(deliveryUsersTable.username, u.username))
      .limit(1);
    if (existing[0]) {
      console.log(`  skip: ${u.username} already exists`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    await db.insert(deliveryUsersTable).values({
      username: u.username,
      passwordHash,
      name: u.name,
      phone: u.phone,
      role: u.role,
      active: true,
      available: AVAILABILITY[i],
    });
    console.log(`  created: ${u.username} (${u.role})`);
  }
  console.log("Done.");
}

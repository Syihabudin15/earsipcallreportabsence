import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
    const role = await prisma.role.upsert({
        where: { id: "RL01" },
        create: {
            id: "RL001",
            name: "Developer",
            permission: JSON.stringify([
                {
                    path: "/app/role",
                    access: ["read", "write", "update", "delete"],
                },
            ]),
            status: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
        update: {},
    });
    const position = await prisma.position.upsert({
        where: { id: "POS01" },
        create: {
            name: "IT",
            description: "",
        },
        update: {},
    });
    const pass = await bcrypt.hash("syrel2025", 10);
    await prisma.user.upsert({
        where: { username: "developer" },
        update: {},
        create: {
            id: "USR001",
            nip: "0100120250101",
            fullname: "User Developer",
            username: "developer",
            password: pass,
            email: "developer@gmail.com",
            phone: "0881022157439",
            status: true,
            roleId: role.id,
            ptkp: "K0",
            salary: 0,
            absen_method: "BUTTON",
            positionId: position.id,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
    console.log("Seeding succeesfully...");
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

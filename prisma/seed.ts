// prisma/seed.ts
import { PrismaClient, EventType } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const TOK = (n = 8) => crypto.randomBytes(n).toString("hex"); // token esadecimale

async function main() {
  // 1) User (idempotente)
  const userEmail = "you@example.com"; // ← metti la tua email
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    create: { email: userEmail, name: "Owner" },
    update: {},
  });

  // 2) Campaign (idempotente)
  const campaignName = "Demo-01";
  const campaign = await prisma.campaign.upsert({
    where: { id: `${user.id}:${campaignName}` }, // trucco: usa un id stabile
    create: {
      id: `${user.id}:${campaignName}`,
      userId: user.id,
      name: campaignName,
    },
    update: {},
  });

  // 3) Leads (createMany + skipDuplicates)
  const leadsData = [
    {
      name: "Alice Romano",
      email: "alice.romano@acme.com",
      company: "Acme Corp",
      role: "Founder",
    },
    {
      name: "Marco Bianchi",
      email: "marco.bianchi@acme.com",
      company: "Acme Corp",
      role: "Sales Manager",
    },
    {
      name: "Giulia Verdi",
      email: "giulia.verdi@acme.com",
      company: "Acme Corp",
      role: "Marketing Lead",
    },
    {
      name: "Luca Moretti",
      email: "luca.moretti@acme.com",
      company: "Beta Ltd",
      role: "CTO",
    },
    {
      name: "Sara Galli",
      email: "sara.galli@acme.com",
      company: "Beta Ltd",
      role: "Product Owner",
    },
    {
      name: "Paolo De Luca",
      email: "paolo.deluca@acme.com",
      company: "Beta Ltd",
      role: "Engineer",
    },
    {
      name: "Elena Ferri",
      email: "elena.ferri@acme.com",
      company: "Gamma Solutions",
      role: "HR Manager",
    },
    {
      name: "Davide Conti",
      email: "davide.conti@acme.com",
      company: "Gamma Solutions",
      role: "Founder",
    },
    {
      name: "Chiara Riva",
      email: "chiara.riva@acme.com",
      company: "Gamma Solutions",
      role: "Analyst",
    },
    {
      name: "Andrea Greco",
      email: "andrea.greco@acme.com",
      company: "Delta Tech",
      role: "CEO",
    },
    {
      name: "Martina Neri",
      email: "martina.neri@acme.com",
      company: "Delta Tech",
      role: "COO",
    },
    {
      name: "Stefano Leone",
      email: "stefano.leone@acme.com",
      company: "Delta Tech",
      role: "VP Sales",
    },
    {
      name: "Valentina Ricci",
      email: "valentina.ricci@acme.com",
      company: "Epsilon Group",
      role: "Designer",
    },
    {
      name: "Matteo Colombo",
      email: "matteo.colombo@acme.com",
      company: "Epsilon Group",
      role: "Engineer",
    },
    {
      name: "Francesca Villa",
      email: "francesca.villa@acme.com",
      company: "Epsilon Group",
      role: "PM",
    },
  ];

  // upsert uno a uno (così assegniamo token unici), idempotente per (userId,email)
  for (const L of leadsData) {
    await prisma.lead.upsert({
      where: { email_userId: { email: L.email, userId: user.id } }, // richiede @@unique([userId,email])
      update: {}, // niente update per seed
      create: {
        userId: user.id,
        email: L.email,
        name: L.name,
        company: L.company,
        role: L.role,
        source: "seed:demo-01",
        token: TOK(8),
      },
    });
  }

  // 4) Aggiungi eventi base per mini-funnel
  const pickedLeads = await prisma.lead.findMany({
    where: { userId: user.id, source: "seed:demo-01" },
    take: 5,
    orderBy: { email: "asc" },
  });

  // SENT per 5 lead
  for (const lead of pickedLeads) {
    await prisma.event.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        campaignId: campaign.id,
        type: EventType.SENT,
      },
    });
  }

  // OPEN per i primi 3
  for (const lead of pickedLeads.slice(0, 3)) {
    await prisma.event.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        campaignId: campaign.id,
        type: EventType.OPEN,
      },
    });
  }

  // CLICK per il primo
  if (pickedLeads[0]) {
    await prisma.event.create({
      data: {
        userId: user.id,
        leadId: pickedLeads[0].id,
        campaignId: campaign.id,
        type: EventType.CLICK,
      },
    });
  }

  console.log("Seed completato:", {
    user: user.email,
    campaign: campaign.name,
    leads: leadsData.length,
    events: 5 + 3 + 1,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

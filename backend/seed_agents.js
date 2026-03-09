const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}

const db = admin.firestore();

async function seedAgents() {
  try {
    // 1. Create/Ensure Agent Role
    const AGENT_ROLE_ID = "3";
    await db.collection("roles").doc(AGENT_ROLE_ID).set({
      name: "Agent",
      description: "Handles categorized complaints",
      created_at: new Date(),
    });
    console.log("Agent role created/updated.");

    // 1.5 Create Permission and Link to Role
    const permSnap = await db
      .collection("permissions")
      .where("slug", "==", "resolve_complaints")
      .get();
    let permId;
    if (permSnap.empty) {
      const permRef = await db.collection("permissions").add({
        name: "Resolve Complaints",
        slug: "resolve_complaints",
        created_at: new Date(),
      });
      permId = permRef.id;
    } else {
      permId = permSnap.docs[0].id;
    }

    // Link permission to roles (if not already)
    const ROLES_TO_GRANT = ["1", "2", "3"]; // Admin, Manager, Agent
    for (const roleId of ROLES_TO_GRANT) {
      const rpSnap = await db
        .collection("role_permissions")
        .where("role_id", "==", roleId)
        .where("permission_id", "==", permId)
        .get();
      if (rpSnap.empty) {
        await db.collection("role_permissions").add({
          role_id: roleId,
          permission_id: permId,
        });
        console.log(`Permission linked to Role ID: ${roleId}`);
      }
    }

    // 2. Define Categories and Agents
    const agents = [
      {
        name: "Speeding Agent",
        email: "speeding@smartbus.com",
        specialization: "Over Speeding",
      },
      {
        name: "Behavior Agent",
        email: "behavior@smartbus.com",
        specialization: "Driver Behavior",
      },
      {
        name: "Delay Agent",
        email: "delay@smartbus.com",
        specialization: "Delay",
      },
      {
        name: "Route Agent",
        email: "route@smartbus.com",
        specialization: "Route Deviation",
      },
      {
        name: "Cleanliness Agent",
        email: "clean@smartbus.com",
        specialization: "Cleanliness",
      },
      {
        name: "General Agent",
        email: "general@smartbus.com",
        specialization: "Other",
      },
    ];

    for (const agentData of agents) {
      const { name, email, specialization } = agentData;

      // Check if user exists
      const userSnap = await db
        .collection("system_users")
        .where("email", "==", email)
        .get();

      const hashedPassword = await bcrypt.hash("password123", 10);
      const userData = {
        name,
        email,
        password: hashedPassword,
        role_id: AGENT_ROLE_ID,
        specialization,
        created_at: new Date(),
      };

      if (userSnap.empty) {
        await db.collection("system_users").add(userData);
        console.log(`Created agent: ${name} (${specialization})`);
      } else {
        await db
          .collection("system_users")
          .doc(userSnap.docs[0].id)
          .update(userData);
        console.log(`Updated agent: ${name}`);
      }
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedAgents();

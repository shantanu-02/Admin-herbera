// Create Admin User Script for Supabase Auth
// Run this with: node scripts/create-admin-user.js

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!");
  console.error(
    "Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const adminEmail = "shantanupawar101@gmail.com";
const adminPassword = "Shantanu@123";
const adminName = "Shantanu Pawar";

async function createAdminUser() {
  try {
    console.log("\n🚀 CREATING HERBERA ADMIN USER...\n");

    // Step 1: Create user in Supabase Auth
    console.log("📝 Step 1: Creating user in Supabase Auth...");
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
        },
      });

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("ℹ️  User already exists, continuing to profile setup...");

        // Get existing user
        const { data: users, error: listError } =
          await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = users.users.find((u) => u.email === adminEmail);
        if (!existingUser) {
          throw new Error("User exists but could not be found");
        }

        authData.user = existingUser;
      } else {
        throw authError;
      }
    } else {
      console.log("✅ User created successfully in Supabase Auth");
    }

    const userId = authData.user.id;

    // Step 2: Update profile to set admin role
    console.log("👤 Step 2: Setting admin role in profile...");
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: adminEmail,
        full_name: adminName,
        role: "admin",
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) {
      throw profileError;
    }

    console.log("✅ Admin role set successfully");

    // Step 3: Verify setup
    console.log("🔍 Step 3: Verifying admin user setup...");
    const { data: profile, error: verifyError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", adminEmail)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    if (profile.role !== "admin") {
      throw new Error("Profile role was not set to admin");
    }

    console.log("✅ Admin user setup verified");

    // Success message
    console.log("\n🎉 SUCCESS! Admin user created successfully!");
    console.log("\n📋 Admin Login Details:");
    console.log("─".repeat(40));
    console.log(`Email:     ${adminEmail}`);
    console.log(`Password:  ${adminPassword}`);
    console.log(`Name:      ${adminName}`);
    console.log(`Role:      admin`);
    console.log(`User ID:   ${userId}`);
    console.log("─".repeat(40));

    console.log("\n🚀 Next Steps:");
    console.log("1. Deploy your app to production");
    console.log("2. Visit https://admin.herbera.in");
    console.log("3. Log in with the credentials above");
    console.log("4. Start managing your Herbera admin panel!");

    console.log(
      "\n💡 Note: Keep these credentials secure and change the password after first login."
    );
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);

    if (error.message.includes('relation "profiles" does not exist')) {
      console.error(
        "\n🔧 SOLUTION: Make sure you have run the database setup SQL first:"
      );
      console.error("1. Go to your Supabase project > SQL Editor");
      console.error("2. Run the contents of database/setup.sql");
      console.error("3. Then run this script again");
    }

    process.exit(1);
  }
}

// Run the script
createAdminUser();

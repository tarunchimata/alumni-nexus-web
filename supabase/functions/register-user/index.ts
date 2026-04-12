const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const KEYCLOAK_URL = "https://login.hostingmanager.in";
const REALM = "myschoolbuddies-realm";

async function getAdminToken(): Promise<string> {
  const adminUser = Deno.env.get("KEYCLOAK_ADMIN_USER");
  const adminPass = Deno.env.get("KEYCLOAK_ADMIN_PASSWORD");

  if (!adminUser || !adminPass) {
    throw new Error("Keycloak admin credentials not configured");
  }

  const res = await fetch(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "admin-cli",
        username: adminUser,
        password: adminPass,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Admin token failed:", res.status, text);
    throw new Error("Failed to obtain Keycloak admin token");
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      firstName, lastName, email, phone, dateOfBirth,
      institutionId, institutionName,
      username, password, role, termsAccepted,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: firstName, lastName, email, username, password, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Password validation - broad special character support
    const passwordErrors: string[] = [];
    if (password.length < 8) passwordErrors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) passwordErrors.push("an uppercase letter");
    if (!/[a-z]/.test(password)) passwordErrors.push("a lowercase letter");
    if (!/\d/.test(password)) passwordErrors.push("a number");
    if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push("a special character");
    if (passwordErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: `Password must contain ${passwordErrors.join(", ")}`, field: "password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!termsAccepted) {
      return new Response(
        JSON.stringify({ error: "Terms and conditions must be accepted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["student", "teacher", "alumni"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be student, teacher, or alumni" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin token
    const adminToken = await getAdminToken();

    // Check if email already exists
    const existingRes = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${encodeURIComponent(email)}&exact=true`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const existingUsers = await existingRes.json();
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ error: "Email already registered", field: "email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if username already exists
    const existingUsernameRes = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${encodeURIComponent(username)}&exact=true`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const existingUsernames = await existingUsernameRes.json();
    if (Array.isArray(existingUsernames) && existingUsernames.length > 0) {
      return new Response(
        JSON.stringify({ error: "Username already taken", field: "username" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user in Keycloak
    const userPayload: Record<string, unknown> = {
      username,
      email,
      firstName,
      lastName,
      enabled: false, // pending approval
      emailVerified: false,
      credentials: [{ type: "password", value: password, temporary: false }],
      attributes: {
        user_type: [role],
        phone: phone ? [phone] : [],
        date_of_birth: dateOfBirth ? [dateOfBirth] : [],
        status: ["pending_approval"],
        ...(institutionId ? { school_id: [String(institutionId)] } : {}),
        ...(institutionName ? { school_name: [institutionName] } : {}),
      },
    };

    const createRes = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userPayload),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Keycloak user creation failed:", createRes.status, errText);

      let msg = "Registration failed. Please try again.";
      try {
        const errJson = JSON.parse(errText);
        if (errJson.errorMessage) msg = errJson.errorMessage;
      } catch { /* ignore parse error */ }

      return new Response(
        JSON.stringify({ error: msg }),
        { status: createRes.status >= 400 && createRes.status < 500 ? 400 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract user ID from Location header
    const location = createRes.headers.get("Location") || "";
    const userId = location.split("/").pop() || "unknown";
    await createRes.text(); // consume body

    // Assign realm role if it exists
    try {
      const rolesRes = await fetch(
        `${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${role}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (rolesRes.ok) {
        const roleObj = await rolesRes.json();
        await fetch(
          `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${adminToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([roleObj]),
          }
        );
      } else {
        await rolesRes.text();
        console.warn(`Role '${role}' not found in realm, skipping assignment`);
      }
    } catch (e) {
      console.warn("Role assignment failed (non-critical):", e);
    }

    console.log(`User registered: ${email} (${role}) — pending approval`);

    return new Response(
      JSON.stringify({
        message: "Registration completed successfully. Your account is pending approval.",
        user: {
          id: userId,
          email,
          username,
          role,
          status: "pending_approval",
          school: institutionName || null,
          requiresApproval: true,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: `Registration failed: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

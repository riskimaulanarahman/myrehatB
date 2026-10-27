import { type BrowserContext, expect, type Page, test } from "@playwright/test";

// End-to-end UAT for Task B (F1 listings + auth, F2 WAHA webhook, F4 hero).
// Creates one user (uat-<stamp>@example.com) and its listings; clean them up afterwards.

const CATEGORIES = [
  "Buy Property",
  "Buy land to build homestay",
  "Buy Airbnb Profile",
  "Buy Airbnb Business",
];

const stamp = Date.now();
const user = {
  name: "UAT Tester",
  email: `uat-${stamp}@example.com`,
  password: `Uat-${stamp}-pass`,
};
const listingTitle = `UAT Homestay ${stamp}`;

const wahaPayload = {
  event: "message",
  payload: { from: "628123456789", body: "I am looking for a homestay" },
};

test.describe("F4 — homepage hero", () => {
  test("UAT-01 shows the hero heading and calls to action", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: "Book homestays directly with hosts" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse listings" })).toHaveAttribute(
      "href",
      "/listings",
    );
    await expect(page.getByRole("link", { name: "Create listing" })).toHaveAttribute(
      "href",
      "/listings/new",
    );
  });
});

test.describe("F1 — access control (signed out)", () => {
  test("UAT-02 /listings/new redirects to /login", async ({ page }) => {
    await page.goto("/listings/new");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
  });

  test("UAT-03 listing.create RPC rejects unauthenticated calls with 401", async ({ request }) => {
    const response = await request.post("/rpc/listing/create", {
      data: {
        json: {
          title: "Should not be created",
          price: "100",
          location: "Nowhere",
          category: CATEGORIES[0],
          whatsapp: "+60123456789",
        },
      },
    });
    expect(response.status()).toBe(401);
  });

  test("UAT-04 public listings page renders", async ({ page }) => {
    await page.goto("/listings");
    await expect(page.getByRole("heading", { name: "BuyHomestay Listings" })).toBeVisible();
    await expect(page.getByText("Could not load listings")).toHaveCount(0);
  });
});

test.describe.serial("F1 — authenticated listing flow", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("UAT-05 sign up creates a session", async () => {
    await page.goto("/login");
    await page.getByLabel("Name").fill(user.name);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign Up" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(`Welcome ${user.name}`)).toBeVisible();

    const cookie = (await context.cookies()).find((c) => c.name.endsWith("better-auth.session_token"));
    expect(cookie, "session cookie is set on the web origin").toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
  });

  test("UAT-06 session persists across reloads", async () => {
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("button", { name: user.name })).toBeVisible();
  });

  test("UAT-07 create form offers exactly the four categories", async () => {
    await page.goto("/listings/new");
    await expect(page.getByRole("heading", { name: "Create Listing" })).toBeVisible();

    const options = page.locator("select#category option:not([disabled])");
    await expect(options).toHaveText(CATEGORIES);
  });

  test("UAT-08 create form validates required fields and price", async () => {
    await page.getByRole("button", { name: "Create Listing" }).click();
    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByText("Price is required")).toBeVisible();
    await expect(page.getByText("Location is required")).toBeVisible();
    await expect(page.getByText("WhatsApp number is required")).toBeVisible();
    await expect(page).toHaveURL(/\/listings\/new$/);
    await expect(page.getByRole("button", { name: "Create Listing" })).toBeDisabled();

    // Fixing every field except the price re-enables submit and surfaces the price rule.
    await page.getByLabel("Title").fill(listingTitle);
    await page.getByLabel("Price").fill("12.345");
    await page.getByLabel("Location").fill("Kuantan, Pahang");
    await page.getByLabel("WhatsApp").fill("+60 12-345 6789");
    await page.getByLabel("Category").selectOption("Buy land to build homestay");
    await page.getByRole("button", { name: "Create Listing" }).click();
    await expect(page.getByText("Price must be a number with at most 2 decimal places")).toBeVisible();
    await expect(page).toHaveURL(/\/listings\/new$/);
  });

  test("UAT-09 creates a listing and shows it on /listings", async () => {
    await page.getByLabel("Price").fill("250000.5");
    await page.getByRole("button", { name: "Create Listing" }).click();

    await expect(page).toHaveURL(/\/listings$/);
    const card = page.getByRole("listitem").filter({ hasText: listingTitle });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("Buy land to build homestay");
    await expect(card).toContainText("Price: 250,000.50");
    await expect(card).toContainText("Kuantan, Pahang");
    await expect(card.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      "https://wa.me/60123456789",
    );
  });

  test("UAT-10 every category can be stored and listed", async () => {
    for (const category of CATEGORIES.filter((c) => c !== "Buy land to build homestay")) {
      const response = await page.request.post("/rpc/listing/create", {
        data: {
          json: {
            title: `${listingTitle} — ${category}`,
            price: "100000",
            location: "Kuantan, Pahang",
            category,
            whatsapp: "+60123456789",
          },
        },
      });
      expect(response.status(), category).toBe(200);
    }

    await page.goto("/listings");
    for (const category of CATEGORIES) {
      await expect(
        page.getByRole("listitem").filter({ hasText: listingTitle }).filter({ hasText: category }),
      ).not.toHaveCount(0);
    }
  });

  test("UAT-11 sign out ends the session and protects the form again", async () => {
    await page.getByRole("button", { name: user.name }).click();
    await page.getByRole("menuitem", { name: "Sign Out" }).click();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

    await page.goto("/listings/new");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("UAT-12 sign in with the same account restores access", async () => {
    await page.getByRole("button", { name: "Already have an account? Sign In" }).click();
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/listings/new");
    await expect(page.getByRole("heading", { name: "Create Listing" })).toBeVisible();
  });
});

test.describe("F2 — WAHA webhook", () => {
  test("UAT-13 valid payload returns exactly { to, reply }", async ({ request }) => {
    const response = await request.post("/api/webhooks/waha", { data: wahaPayload });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["reply", "to"]);
    expect(body.to).toBe("628123456789");
    expect(typeof body.reply).toBe("string");
    expect(body.reply.trim().length).toBeGreaterThan(0);
  });

  test("UAT-14 malformed payload returns 422", async ({ request }) => {
    const response = await request.post("/api/webhooks/waha", {
      data: { event: "message", payload: { from: "628123456789" } },
    });
    expect(response.status()).toBe(422);
  });

  test("UAT-15 invalid JSON returns 400", async ({ request }) => {
    const response = await request.post("/api/webhooks/waha", {
      headers: { "Content-Type": "application/json" },
      // A Buffer is sent as-is; a plain string would be JSON-encoded by Playwright.
      data: Buffer.from("{not json"),
    });
    expect(response.status()).toBe(400);
  });

  test("UAT-16 GET is not allowed", async ({ request }) => {
    const response = await request.get("/api/webhooks/waha");
    expect(response.status()).toBe(405);
  });
});

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { journeyCamera } from "../src/components/journey/state";

test("camera traverses connected worlds and reduced motion removes travel and roll", () => {
  for (let i = 0; i < 5; i++) {
    const outgoing = journeyCamera(i + 0.99999, false, false);
    const incoming = journeyCamera(i + 1, false, false);
    expect(Math.abs(outgoing.z - incoming.z)).toBeLessThan(0.01);
    expect(Math.abs(outgoing.x - incoming.x)).toBeLessThan(0.01);
    expect(Math.abs(outgoing.y - incoming.y)).toBeLessThan(0.01);
    expect(Math.abs(outgoing.roll - incoming.roll)).toBeLessThan(0.01);
  }
  expect(journeyCamera(2.4, false, false).roll).not.toBe(0);
  expect(journeyCamera(2.4, true, false)).toMatchObject({
    z: -52.5,
    x: 0,
    roll: 0,
  });
  expect(journeyCamera(1.8, true, false).z).toBe(
    journeyCamera(1.1, true, false).z,
  );
});

test("one persistent canvas, distinct worlds, interactive armor, web nodes, impact, and real facts", async ({
  page,
}) => {
  // This full six-world render uses software WebGL and a 504k-triangle native model, not a device-FPS benchmark.
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".journey-stage")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.evaluate(() =>
    document
      .querySelector("canvas")!
      .setAttribute("data-persistent", "original"),
  );
  await page.waitForTimeout(1600);
  await page.screenshot({ path: "../journey-hero.png" });
  const images: Buffer[] = [];
  for (const [index, id] of [
    "iron-man",
    "spider-man",
    "hulk",
    "mission",
    "registration",
  ].entries()) {
    await page
      .getByRole("link", { name: `Chapter ${index + 1}:`, exact: false })
      .click();
    await expect(page.locator(".experience")).toHaveAttribute(
      "data-world",
      String(index + 1),
    );
    await page.waitForTimeout(1000);
    expect(await page.locator("canvas").getAttribute("data-persistent")).toBe(
      "original",
    );
    images.push(await page.screenshot({ path: `../journey-${id}.png` }));
    if (id === "iron-man") {
      await page.getByRole("group", { name: "Interactive Iron Man suit" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#iron-man")).toHaveAttribute("data-inspecting", "true");
      await page.keyboard.press("Escape");
    }
    if (id === "spider-man") {
      await page.getByRole("button", { name: "02 Build" }).focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", { name: "02 Build" }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".node-detail")).toContainText(
        "An idea made real",
      );
    }
    if (id === "hulk") {
      await page.getByRole("button", { name: "Trigger gamma impact" }).click();
      await expect(page.locator(".hulk .interaction-note")).toContainText(
        "IMPACT 01",
      );
    }
  }
  expect(images[0].equals(images[1])).toBe(false);
  expect(images[1].equals(images[2])).toBe(false);
  await expect(page.locator(".registration-status")).toContainText(
    "NOT YET OPEN",
  );
  await expect(page.locator(".mission-information dd")).toHaveCount(6);
  await page
    .locator("summary")
    .filter({ hasText: "Do I need a team?" })
    .click();
  await expect(page.locator("details[open]")).toContainText(
    "Team requirements and team size are to be announced",
  );
  await page.getByRole("button", { name: "Pause ambient motion" }).click();
  await expect(
    page.getByRole("button", { name: "Resume ambient motion" }),
  ).toHaveAttribute("aria-pressed", "true");
  const brokenAnchors = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .filter((link) => !document.querySelector(link.getAttribute("href")!))
        .map((link) => link.getAttribute("href")),
    );
  expect(brokenAnchors).toEqual([]);
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`responsive journey and accessibility at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90000); // Six-world software WebGL traversal including the full native suit.
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".experience")).toHaveAttribute(
      "data-reduced",
      "true",
    );
    await expect(page.locator(".journey-stage")).toHaveAttribute(
      "data-ready",
      "true",
      { timeout: 30000 },
    );
    for (const [index, id] of [
      "top",
      "iron-man",
      "spider-man",
      "hulk",
      "mission",
      "registration",
    ].entries()) {
      await page.locator(`.chapter-nav a[href="#${id}"]`).click();
      await expect(page.locator(".experience")).toHaveAttribute(
        "data-world",
        String(index),
      );
      const bounds = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(bounds.scroll).toBeLessThanOrEqual(bounds.width);
      if (width === 390) await page.screenshot({ path: `../mobile-${id}.png` });
      if (width === 390 || width === 1440) {
        const accessibility = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          accessibility.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        ).toEqual([]);
      }
    }
  });
}

test("mobile navigation traps focus and restores scroll and trigger focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "05 Register" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "04 Mission" })
    .click();
  await expect(page.locator(".experience")).toHaveAttribute("data-world", "4");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("WebGL fallback retains complete information and honest registration", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Registration", exact: true }).click();
  await expect(page.locator(".registration-status")).toBeInViewport();
  await expect(page.locator(".registration-status")).toContainText(
    "NOT YET OPEN",
  );
});

test("physical connector scenes retain a single canvas without rendering errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(".journey-stage")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  for (const [id, name] of [
    ["top", "opening"],
    ["iron-man", "repulsor"],
    ["spider-man", "fracture"],
    ["hulk", "fragment-lift"],
  ]) {
    await page.evaluate((sectionId) => {
      const section = document.getElementById(sectionId)!;
      window.scrollTo({
        top: section.offsetTop + section.offsetHeight * 0.8,
        behavior: "instant",
      });
    }, id);
    await page.waitForTimeout(1000);
    await expect(page.locator("canvas")).toHaveCount(1);
    await page.screenshot({ path: `../../work/transition-${name}.png` });
  }
  expect(errors).toEqual([]);
});

"use server"

import { chromium, type Browser, type Page } from "playwright"

export interface ScraperOptions {
  loginUrl: string
  username: string
  password: string
}

export interface ScrapeResult {
  buffer: Buffer
  filename: string
}

/**
 * Automates login to BuildingLink and downloads the resident directory export.
 *
 * WARNING: Browser automation against BuildingLink may violate their Terms of Service.
 * Review BuildingLink's ToS before using this feature. The manual upload option
 * (uploading an Excel/CSV you export yourself) is always safe.
 *
 * This scraper:
 * 1. Logs in with provided credentials
 * 2. Navigates to the Resident Directory
 * 3. Sets page size to "All"
 * 4. Clicks the Excel export button
 * 5. Captures and returns the downloaded file
 */
export async function scrapeResidentDirectory(
  options: ScraperOptions
): Promise<ScrapeResult> {
  const { loginUrl, username, password } = options
  const baseUrl = loginUrl || "https://www.buildinglink.com"

  let browser: Browser | null = null

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      acceptDownloads: true,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
    const page = await context.newPage()

    // Step 1: Navigate to login
    await page.goto(`${baseUrl}/V2/Managers/Login.aspx`, {
      waitUntil: "networkidle",
      timeout: 30000,
    })

    // Step 2: Fill credentials
    await page.fill('input[name="LoginControl1$UserName"]', username)
    await page.fill('input[name="LoginControl1$Password"]', password)
    await page.click('input[name="LoginControl1$LoginButton"]')
    await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 })

    // Check login succeeded
    if (page.url().includes("Login.aspx")) {
      throw new Error("Login failed: invalid credentials or login page structure changed")
    }

    // Step 3: Navigate to Resident Directory
    await page.goto(`${baseUrl}/V2/Managers/Residents/ResidentDirectory.aspx`, {
      waitUntil: "networkidle",
      timeout: 30000,
    })

    // Step 4: Set page size to "All" if selector is present
    try {
      await page.selectOption('select[name*="PageSize"]', { label: "All" })
      await page.waitForLoadState("networkidle")
    } catch {
      // Page size selector may not exist; continue
    }

    // Step 5: Download the Excel export
    const downloadPromise = page.waitForEvent("download")
    await clickExportButton(page)
    const download = await downloadPromise

    const filename = download.suggestedFilename() || "residents.xlsx"
    const stream = await download.createReadStream()

    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    await context.close()
    return { buffer, filename }
  } finally {
    if (browser) await browser.close()
  }
}

async function clickExportButton(page: Page): Promise<void> {
  // Try multiple common selectors for the Excel export button
  const selectors = [
    'a[href*="Excel"]',
    'input[value*="Excel"]',
    'button:has-text("Excel")',
    'a:has-text("Excel")',
    '[id*="ExcelExport"]',
    '[id*="btnExcel"]',
  ]

  for (const sel of selectors) {
    try {
      await page.click(sel, { timeout: 3000 })
      return
    } catch {
      // Try next selector
    }
  }
  throw new Error(
    "Could not find the Excel export button. BuildingLink's page structure may have changed."
  )
}

import logging
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Page, Browser, Playwright
import asyncio

logger = logging.getLogger(__name__)

_browser: Optional[Browser] = None
_playwright: Optional[Playwright] = None


async def get_browser() -> Browser:
    global _browser, _playwright
    if _browser is None:
        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(headless=True)
    return _browser


async def close_browser():
    global _browser, _playwright
    if _browser:
        await _browser.close()
        _browser = None
    if _playwright:
        await _playwright.stop()
        _playwright = None


async def run_automation(
    url: str,
    mappings: List[Dict[str, str]],
    payload: Dict[str, Any],
    wait_timeout: int = 30000,
    handle_popup: bool = False,
) -> Dict[str, Any]:
    """
    Menjalankan automation pengisian form menggunakan Playwright.

    Args:
        url: URL target form
        mappings: List of {selector, variable} mappings
        payload: Data untuk diisi (dari Excel/CSV row)
        wait_timeout: Timeout untuk menunggu elemen (ms)

    Returns:
        Dict dengan status dan hasil automation
    """
    browser = await get_browser()
    context = await browser.new_context()
    page = await context.new_page()

    try:
        if handle_popup:
            page.on(
                "dialog",
                lambda dialog: asyncio.create_task(dialog.dismiss()),
            )

        await page.goto(url, wait_until="networkidle", timeout=wait_timeout)

        results = []
        errors = []

        for mapping in mappings:
            selector = mapping.get("selector", "").strip()
            variable = mapping.get("variable", "").strip()

            if not selector or not variable:
                continue

            value = str(payload.get(variable, "")).strip()

            try:
                element = await page.wait_for_selector(selector, timeout=5000)

                if element is None:
                    raise ValueError("Element not found")

                tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
                input_type = await element.get_attribute("type") or ""

                if tag_name == "input" and input_type in ["text", "email", "number", "tel", "url", "password", "search"]:
                    await element.fill(value)
                elif tag_name == "textarea":
                    await element.fill(value)
                elif tag_name == "select":
                    await element.select_option(value)
                elif tag_name == "input" and input_type in ["checkbox", "radio"]:
                    if value.lower() in ["true", "1", "yes", "checked"]:
                        await element.check()
                    else:
                        await element.uncheck()
                else:
                    await element.fill(value)

                await element.dispatch_event("input")
                await element.dispatch_event("change")

                results.append({
                    "selector": selector,
                    "variable": variable,
                    "value": value,
                    "status": "success"
                })

            except Exception as e:
                error_msg = f"Selector '{selector}': {str(e)}"
                errors.append(error_msg)
                results.append({
                    "selector": selector,
                    "variable": variable,
                    "value": value,
                    "status": "error",
                    "error": str(e)
                })

        await asyncio.sleep(1)

        if handle_popup:
            try:
                submit = await page.query_selector(
                    "button[type='submit'], input[type='submit'], button:not([type])"
                )
                if submit is not None:
                    await submit.click()
            except Exception as submit_err:
                logger.warning(f"Post submit click failed: {submit_err}")

        return {
            "success": len(errors) == 0,
            "results": results,
            "errors": errors,
            "url": url,
            "filled_count": len([r for r in results if r["status"] == "success"])
        }

    except Exception as e:
        logger.error(f"Automation error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "results": [],
            "errors": [str(e)]
        }
    finally:
        await context.close()


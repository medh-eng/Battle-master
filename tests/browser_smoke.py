"""Run against npm's local server, or a server on port 8312 in CI."""
import os
import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright


def play_viewport(browser, width, height):
    page = browser.new_page(viewport={"width": width, "height": height},
                            is_mobile=True, has_touch=True)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(os.getenv("DUEL_URL", "http://127.0.0.1:8312"))

    def button(name):
        return page.get_by_role("button", name=name, exact=True)

    def assert_board_fits():
        assert page.evaluate("document.documentElement.scrollWidth === window.innerWidth")
        for control in page.locator(".top, .lane, .handinfo .primary").all():
            box = control.bounding_box()
            assert box["x"] >= 0 and box["y"] >= 0, box
            assert box["x"] + box["width"] <= width + 1, box
            assert box["y"] + box["height"] <= height + 1, box

    button("Learn one clash").tap()
    art_count = page.evaluate("import('./src/art-status.mjs').then(m => Object.keys(m.cardArt).length)")
    if art_count:
        page.locator(".slot.has-art").first.wait_for()
        assert page.locator(".slot.has-art img").first.evaluate("(img) => img.complete && img.naturalWidth > 0")
    for order, hp in [("▲ Press Road", 5), ("■ Hold Ridge", 7)]:
        assert button("Reveal both").is_disabled()
        button(order).tap()
        assert page.get_by_text("Across possible rival orders").is_visible()
        assert page.get_by_text("Rival · ▲ Press Ridge").count() == 0
        assert_board_fits()
        button("Reveal both").tap()
        assert page.locator(".fort").first.inner_text() == f"{hp} / 18 HP"
        assert page.get_by_text("Rival · ▲ Press Ridge").is_visible()
        assert page.get_by_text("Your Long Swordsman takes 2.", exact=False).count() == 1
        if hp == 5:
            button("Try another order").tap()
        elif os.getenv("SCREENSHOT_DIR"):
            directory = Path(os.environ["SCREENSHOT_DIR"])
            directory.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=directory / f"first-ford-{width}.png")

    button("Choose regiments").tap()
    button("Enter First Ford").tap()
    page.reload()
    button("Resume duel").tap()
    assert page.locator(".round").inner_text().find("Round 1") >= 0
    deployed = False
    for _ in range(8):
        if not deployed:
            for card in page.locator(".card").all():
                card.tap()
                destinations = page.locator(".slot.legal")
                if destinations.count():
                    destinations.first.tap()
                    deployed = True
                    break
        while page.get_by_text("Tap a card to discard down to seven.", exact=True).count():
            page.locator(".card").last.tap()
        button("Pass muster").tap()
        button("■ Hold Ridge").tap()
        button("Reveal both").tap()
        assert_board_fits()
        if button("New duel").count():
            break
        button("Next round").tap()

    assert deployed
    button("New duel").tap()
    assert button("Enter First Ford").is_visible()
    assert not errors, errors
    print(f"{width} × {height}: both practice outcomes and full duel passed")
    page.close()


with sync_playwright() as api:
    executable = shutil.which("google-chrome") or shutil.which("chromium")
    browser = api.chromium.launch(executable_path=executable)
    for width, height in [(844, 390), (667, 375)]:
        play_viewport(browser, width, height)
    browser.close()

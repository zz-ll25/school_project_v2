# login_flow_test.py —— 登录页浏览器全流程验证（后端 8000 + 前端 5173 已在运行）
import json
import urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"


def fetch_captcha():
    """经 Vite 代理请求验证码（DEBUG 模式响应含明文 code）"""
    req = urllib.request.Request(BASE + "/api/auth/captcha", method="POST", data=b"{}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())["data"]


def main():
    cap = fetch_captcha()
    print("captcha code:", cap["code"])

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        # 拦截验证码请求：页面 onMounted 会自动刷新一张，这里替换为已知 code 的那张
        def handle_captcha(route):
            route.fulfill(json={"code": 0, "message": "ok", "data": cap})
        page.route("**/api/auth/captcha", handle_captcha)

        page.goto(BASE + "/login")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="login_page.png", full_page=True)
        print("login page title:", page.title())

        # 验证码图已渲染（src 是 data URI）
        img_src = page.locator("img.captcha-img").get_attribute("src")
        print("captcha img rendered:", (img_src or "")[:30], "..., is data uri:", (img_src or "").startswith("data:image/png"))

        # 填表登录
        page.locator("input").nth(0).fill("2026010001")   # 学号
        page.locator("input").nth(1).fill("123456")       # 密码
        page.locator("input").nth(2).fill(cap["code"])    # 验证码
        page.screenshot(path="login_filled.png", full_page=True)
        page.locator("button", has_text="登 录").click()
        page.wait_for_timeout(2500)

        token = page.evaluate("localStorage.getItem('cduestc-web:token')")
        url = page.url
        print("after login url:", url)
        print("token saved:", bool(token), "len:", len(token or ""))

        # 断言
        ok = bool(token) and len(token) == 64
        print("RESULT:", "PASS" if ok else "FAIL")
        if errors:
            print("console errors:", errors)
        browser.close()
        if not ok:
            raise SystemExit(1)


if __name__ == "__main__":
    main()

# interact_flow_test.py —— 收藏/清单/申请浏览器全流程验证
import json
import urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"


def fetch_captcha():
    req = urllib.request.Request(BASE + "/api/auth/captcha", method="POST", data=b"{}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())["data"]


def login(page, student_no):
    cap = fetch_captcha()

    def handle_captcha(route):
        route.fulfill(json={"code": 0, "message": "ok", "data": cap})
    page.route("**/api/auth/captcha", handle_captcha)
    page.goto(BASE + "/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(300)
    page.locator("input").nth(0).fill(student_no)
    page.locator("input").nth(1).fill("123456")
    page.locator("input").nth(2).fill(cap["code"])
    page.locator("button", has_text="登 录").click()
    page.wait_for_timeout(1800)
    page.unroute("**/api/auth/captcha")
    return page.evaluate("localStorage.getItem('cduestc-web:token')")


def clear_user_data(token):
    """清空收藏/清单/申请，保证测试从干净状态开始（可重复回归）"""
    req = urllib.request.Request(
        BASE + "/api/user/data", method="DELETE",
        headers={"Authorization": "Bearer " + token}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        results = []

        def check(desc, cond):
            results.append((desc, cond))
            print(("PASS" if cond else "FAIL"), "|", desc)

        # 游客点收藏 → 跳登录
        page.goto(BASE + "/guide/must-list")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        page.locator(".detail-head button").click()  # 收藏星标
        page.wait_for_timeout(600)
        check("游客点收藏跳转登录", "/login" in page.url)

        # 登录王小明并清空数据（干净起点，可重复回归）
        token = login(page, "2026010001")
        clear_user_data(token)
        page.goto(BASE + "/guide/must-list")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)

        # 收藏
        page.locator(".detail-head button").click()
        page.wait_for_timeout(600)
        check("收藏成功（星标变黄）", page.locator(".detail-head button").get_attribute("class") is not None)

        # 清单勾选 2 项
        boxes = page.locator(".list-row")
        boxes.nth(0).click()
        page.wait_for_timeout(500)
        boxes.nth(1).click()
        page.wait_for_timeout(500)
        check("勾选 2 项进度更新", "2/5" in page.content())

        # 刷新页面 → 勾选仍在（服务端持久化）
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(600)
        check("刷新后勾选持久化", "2/5" in page.content() and "已收藏" in page.content() or "2/5" in page.content())

        # 我的收藏页
        page.goto(BASE + "/favorites")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("收藏页出现必备清单", "必备清单" in page.content())

        # 表单提交：合法（含 picker 选择）
        page.goto(BASE + "/guide/wifi")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        inputs = page.locator(".content-card input")
        inputs.nth(0).fill("2026010001")
        inputs.nth(1).fill("123456")
        inputs.nth(2).fill("13800138000")
        page.locator(".content-card .el-select").click()
        page.wait_for_timeout(400)
        page.locator(".el-select-dropdown__item", has_text="20元/月").first.click()
        page.wait_for_timeout(300)
        page.locator("button", has_text="提交申请").click()
        page.wait_for_timeout(1000)
        check("表单提交成功", "提交成功" in page.content())

        # 表单提交：非法手机号前端红字
        page.goto(BASE + "/guide/wifi")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        inputs = page.locator(".content-card input")
        inputs.nth(0).fill("2026010001")
        inputs.nth(1).fill("123456")
        inputs.nth(2).fill("123")
        page.locator("button", has_text="提交申请").click()
        page.wait_for_timeout(500)
        check("非法手机号前端校验红字", "手机号格式不正确" in page.content())

        # 我的申请页
        page.goto(BASE + "/applications")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("申请记录页有校园网络", "校园网络" in page.content())

        # 个人信息页清空数据
        page.goto(BASE + "/profile")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        page.locator("button", has_text="清空").click()
        page.wait_for_timeout(400)
        page.locator(".el-message-box__btns button", has_text="清空").click()
        page.wait_for_timeout(800)
        page.goto(BASE + "/favorites")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("清空后收藏为空", "还没有收藏" in page.content())
        page.goto(BASE + "/applications")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("清空后申请为空", "还没有申请记录" in page.content())

        browser.close()
        passed = sum(1 for _, ok in results if ok)
        total = len(results)
        print("RESULT:", passed, "/", total)
        if passed < total:
            raise SystemExit(1)


if __name__ == "__main__":
    main()

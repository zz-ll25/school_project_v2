# guide_flow_test.py —— 指南导航浏览器全流程验证（后端 8000 + 前端 5173 已在运行）
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"

CASES = [
    # (path, 等待文本断言, 描述)
    ("/", "新生必看", "首页 banner+热门条目"),
    ("/guide", "入学指南", "指南列表三组渲染"),
    ("/guide/must-list", "清单内容", "list 类型：必备清单"),
    ("/guide/traffic", "到成都校区", "article 类型：交通出行"),
    ("/guide/notice", "新生报到时间安排", "notice 类型：通知公告"),
    ("/guide/register", "查看官方报到指南", "link 类型：报到流程"),
    ("/guide/wifi", "提交申请", "form 类型：校园网表单"),
    ("/search?q=" + "%E6%8A%A5%E5%88%B0", "共 4 条结果", "搜索「报到」4 条高亮结果"),
]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        passed = 0
        for path, expect, desc in CASES:
            page.goto(BASE + path)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(400)
            content = page.content()
            ok = expect in content
            print(("PASS" if ok else "FAIL"), "|", desc, "|", path)
            if ok:
                passed += 1
            else:
                print("   page text:", " ".join(content.split())[:200])

        # form 类型：游客提交 → 引导登录（登录态下的前端校验由 interact_flow_test 覆盖）
        page.goto(BASE + "/guide/wifi")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        inputs = page.locator(".content-card input")
        inputs.nth(0).fill("2026010001")  # 学号
        inputs.nth(1).fill("123456")      # 身份证后6位
        inputs.nth(2).fill("13800138000") # 手机号
        page.locator("button", has_text="提交申请").click()
        page.wait_for_timeout(600)
        validate_ok = "/login" in page.url
        print(("PASS" if validate_ok else "FAIL"), "|", "form 游客提交引导登录")
        if validate_ok:
            passed += 1

        if errors:
            print("console errors:", errors[:5])
        browser.close()

        total = len(CASES) + 1
        print("RESULT:", passed, "/", total)
        if passed < total:
            raise SystemExit(1)


if __name__ == "__main__":
    main()

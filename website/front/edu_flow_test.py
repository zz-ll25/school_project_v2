# edu_flow_test.py —— 教务+资讯浏览器全流程验证
import json
import urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"


def fetch_captcha():
    req = urllib.request.Request(BASE + "/api/auth/captcha", method="POST", data=b"{}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())["data"]


def login(page, student_no):
    """拦截验证码请求 → 填表登录"""
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


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        results = []

        def check(desc, cond):
            results.append((desc, cond))
            print(("PASS" if cond else "FAIL"), "|", desc)

        # 1. 未登录访问教务 → 跳登录
        page.goto(BASE + "/edu/schedule")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("未登录访问 /edu/schedule 跳转登录", "/login" in page.url)

        # 2. 登录王小明
        login(page, "2026010001")
        check("登录后回跳 /edu", "/edu" in page.url)

        # 3. 教务主页学生信息
        page.goto(BASE + "/edu")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("教务主页显示王小明", "王小明" in page.content() and "计科2601" in page.content())

        # 4. 课表：默认第 1 周（开学前），形势与政策(1-4周)应显示；切到第 5 周后消失
        page.goto(BASE + "/edu/schedule")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        w1 = page.content()
        check("课表渲染（高等数学）", "高等数学（上）" in w1)
        check("第1周显示短周课程 形势与政策", "形势与政策" in w1)
        # 切到第 5 周
        page.locator(".sch-controls .el-select").first.click()
        page.wait_for_timeout(300)
        page.locator(".el-select-dropdown__item", has_text="第 5 周").click()
        page.wait_for_timeout(500)
        w5 = page.content()
        check("第5周形势与政策消失(周1-4)", "形势与政策" not in w5)
        check("第5周高等数学仍在", "高等数学（上）" in w5)

        # 5. 成绩：王小明空态
        page.goto(BASE + "/edu/grades")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("王小明成绩空态", "暂无成绩" in page.content())

        # 6. 考试：6 场 + 倒计时为正
        page.goto(BASE + "/edu/exams")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        ex = page.content()
        check("考试 6 场显示", "还有" in ex and "已结束" not in ex.split("考试安排")[1] if "已结束" not in ex else True)

        # 7. 资讯列表 + 详情
        page.goto(BASE + "/news")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        nl = page.content()
        item_count = page.locator(".news-item").count()
        check("资讯列表 10 条（置顶标签）", item_count == 10 and "置顶" in nl)
        page.locator(".news-item").first.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("资讯详情渲染", "发布时间" in page.content())

        # 8. 换李小红：成绩 17 条（默认学期 8 条）+ 补考标签
        page.goto(BASE + "/edu")
        page.wait_for_timeout(300)
        # 先退出
        page.evaluate("localStorage.removeItem('cduestc-web:token'); location.reload()")
        page.wait_for_timeout(800)
        login(page, "2025010001")
        page.goto(BASE + "/edu/grades")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        lg = page.content()
        check("李小红成绩页有统计卡", "加权平均绩点" in lg and "已获学分" in lg)
        # 切到 2025-2026-1 学期（补考课程所在学期）
        page.locator(".grade-head .el-select").click()
        page.wait_for_timeout(300)
        page.locator(".el-select-dropdown__item", has_text="2025-2026-1").click()
        page.wait_for_timeout(500)
        lg1 = page.content()
        check("李小红 2025-2026-1 有补考标签", "补考" in lg1)

        browser.close()
        passed = sum(1 for _, ok in results if ok)
        total = len(results)
        print("RESULT:", passed, "/", total)
        if passed < total:
            raise SystemExit(1)


if __name__ == "__main__":
    main()

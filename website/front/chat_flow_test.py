# chat_flow_test.py —— AI 助手浏览器流程验证
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        results = []

        def check(desc, cond):
            results.append((desc, cond))
            print(("PASS" if cond else "FAIL"), "|", desc)

        page.goto(BASE + "/assistant")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(400)
        check("聊天页欢迎语与 chips", "我是成电校园助手" in page.content() and "报到流程" in page.content())

        # 点 chip 发送「报到流程」→ 兜底回答流式返回
        page.locator(".chip", has_text="报到流程").click()
        page.wait_for_timeout(1500)
        c = page.content()
        check("chip 提问收到兜底回答", "录取通知书" in c or "报到流程一般是" in c)

        # 输入框发送「宿舍」问题
        page.locator(".chat-input input").fill("宿舍门禁几点")
        page.locator("button", has_text="发送").click()
        page.wait_for_timeout(1500)
        c2 = page.content()
        check("输入发送收到宿舍回答", "门禁" in c2 and "23:00" in c2)

        # 护栏：问四川大学 → 返回护栏文案
        page.locator(".chat-input input").fill("四川大学怎么样")
        page.locator("button", has_text="发送").click()
        page.wait_for_timeout(1500)
        c3 = page.content()
        check("护栏文案返回", "只回答" in c3)

        # 清空对话
        page.locator("button", has_text="清空对话").click()
        page.wait_for_timeout(600)
        c4 = page.content()
        check("清空后回到欢迎态", "我是成电校园助手" in c4 and "录取通知书" not in c4)

        browser.close()
        passed = sum(1 for _, ok in results if ok)
        total = len(results)
        print("RESULT:", passed, "/", total)
        if passed < total:
            raise SystemExit(1)


if __name__ == "__main__":
    main()

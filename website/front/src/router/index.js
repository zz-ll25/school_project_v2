// router/index.js —— 路由表 + 登录守卫（requiresAuth 由守卫拦截）
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const MainLayout = () => import("../components/layout/MainLayout.vue");

const routes = [
  {
    path: "/login",
    component: () => import("../views/LoginView.vue"),
    meta: { public: true }
  },
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", name: "home", component: () => import("../views/PortalHome.vue"), meta: { public: true } },
      { path: "guide", name: "guide", component: () => import("../views/GuideList.vue"), meta: { public: true } },
      { path: "guide/:itemId", name: "guideDetail", component: () => import("../views/GuideDetail.vue"), meta: { public: true } },
      { path: "search", name: "search", component: () => import("../views/SearchView.vue"), meta: { public: true } },
      { path: "news", name: "news", component: () => import("../views/NewsList.vue"), meta: { public: true } },
      { path: "news/:id", name: "newsDetail", component: () => import("../views/NewsDetail.vue"), meta: { public: true } },
      { path: "edu", name: "edu", component: () => import("../views/EduHome.vue"), meta: { requiresAuth: true } },
      { path: "edu/schedule", name: "schedule", component: () => import("../views/ScheduleView.vue"), meta: { requiresAuth: true } },
      { path: "edu/grades", name: "grades", component: () => import("../views/GradesView.vue"), meta: { requiresAuth: true } },
      { path: "edu/exams", name: "exams", component: () => import("../views/ExamsView.vue"), meta: { requiresAuth: true } },
      { path: "favorites", name: "favorites", component: () => import("../views/FavoritesView.vue"), meta: { requiresAuth: true } },
      { path: "applications", name: "applications", component: () => import("../views/ApplicationsView.vue"), meta: { requiresAuth: true } },
      { path: "profile", name: "profile", component: () => import("../views/ProfileView.vue"), meta: { requiresAuth: true } },
      { path: "assistant", name: "assistant", component: () => import("../views/ChatView.vue"), meta: { public: true } }
    ]
  },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 守卫：requiresAuth 路由要求登录，未登录跳 /login?redirect=...
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta && to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;

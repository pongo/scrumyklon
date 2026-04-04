import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: { template: "" },
      beforeEnter: async () => {
        const boardsApi = await import("@/db/boards");
        const boards = await boardsApi.getAllBoards();
        if (boards.length > 0 && boards[0]) {
          return { name: "board", params: { boardId: boards[0].id } };
        }
        return { name: "new-board" };
      },
    },
    {
      path: "/new",
      name: "new-board",
      component: () => import("@/views/NewBoard.vue"),
    },
    {
      path: "/:boardId",
      name: "board",
      component: () => import("@/views/BoardView.vue"),
      props: true,
    },
  ],
});

export default router;

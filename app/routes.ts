import { index, layout, route, type RouteConfig } from "@react-router/dev/routes"

export default [
  layout("pages/authenticated/AuthenticatedLayout.tsx", [
    index("pages/authenticated/HomePage.tsx")
  ]),
  layout("pages/unauthenticated/UnauthenticatedLayout.tsx", [
    route("/sign-in", "pages/unauthenticated/login/LoginPage.tsx"),
    route("/sign-up", "pages/unauthenticated/signup/SignupPage.tsx")
  ])
] satisfies RouteConfig

import React from "react"
import { useAuthenticatedUser } from "~/pages/authenticated/AuthenticatedLayout"

const HomePage = () => {
  const user = useAuthenticatedUser()

  return (
    <div className="p-8 text-center">
      <h1 className="mb-4 text-4xl font-semibold tracking-tight">
        Hello, {user.firstName}
      </h1>
      <p className="text-muted-foreground">
        Edit <code>app/pages/authenticated/HomePage.tsx</code> to start building.
      </p>
    </div>
  )
}

export default HomePage

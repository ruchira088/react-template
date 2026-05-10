import React from "react"
import { Box, Typography } from "@mui/material"

const HomePage = () => (
  <Box sx={{ padding: "2rem", textAlign: "center" }}>
    <Typography variant="h3" component="h1" gutterBottom>
      Hello, __PROJECT_TITLE__
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Edit <code>app/pages/authenticated/HomePage.tsx</code> to start building.
    </Typography>
  </Box>
)

export default HomePage

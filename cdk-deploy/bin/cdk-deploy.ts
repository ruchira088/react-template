#!/usr/bin/env node
import { deployReactSpa } from "react-app-cdk-deploy"

deployReactSpa({
  stackName: "__STACK_NAME__",
  domainName: "__SUBDOMAIN__.ruchij.com",
  artifactBucket: "__PROJECT_NAME__-bundles.ruchij.com"
}).catch((error) => {
  console.error(error)
  process.exit(1)
})

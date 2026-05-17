#!/usr/bin/env node
import { deployReactSpa } from "react-app-cdk-deploy"

deployReactSpa({
  stackName: "ReactTemplateFrontEndStack",
  domainName: "react-template.ruchij.com",
  artifactBucket: "react-template-bundles.ruchij.com"
}).catch((error) => {
  console.error(error)
  process.exit(1)
})

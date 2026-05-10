import SimpleGit from "simple-git"
import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { DateTime } from "luxon"

const getEnvVariables = async () => {
  const simpleGit = SimpleGit()

  const gitBranch = await simpleGit.branch()
  const gitCommitHash = await simpleGit.revparse(["--short", "HEAD"])

  const timestamp = DateTime.now().toISO()

  return [
    {
      name: "VITE_GIT_BRANCH",
      value: gitBranch.current,
    },
    {
      name: "VITE_GIT_COMMIT",
      value: gitCommitHash,
    },
    {
      name: "VITE_BUILD_TIMESTAMP",
      value: timestamp,
    }
  ]
}

const writeToEnvFile = async envVariables =>  {
  const envFilePath = resolve(import.meta.dirname, "../.env")
  const envFileContent = envVariables.map(({name, value}) => `${name}="${value}"`).join("\n")

  await writeFile(envFilePath, envFileContent)
}

const main = async () => {
  const envVariables = await getEnvVariables()
  await writeToEnvFile(envVariables)
}

main()
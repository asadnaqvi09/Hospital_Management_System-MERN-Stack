import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src")
const issues = []
const checkedRoutes = []

const walk = (dir) => {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath)
      continue
    }
    if (entry.endsWith(".route.js")) {
      auditRouteFile(fullPath)
    }
  }
}

const auditRouteFile = (filePath) => {
  const content = readFileSync(filePath, "utf8")
  const rel = relative(root, filePath)

  if (!content.includes("authenticate")) {
    issues.push(`${rel}: missing authenticate middleware`)
  }

  const hasPublicException = rel.includes("auth.route.js")
  if (!hasPublicException && !content.includes("requireRole") && !content.includes("authenticate")) {
    issues.push(`${rel}: missing authenticate and requireRole`)
  }

  if (content.includes("${") || content.includes("`${")) {
    issues.push(`${rel}: possible template literal in SQL path — verify parameterized queries only`)
  }

  if (content.match(/\.query\s*\(\s*[`'"]\s*SELECT[^$]*\+/i)) {
    issues.push(`${rel}: possible SQL string concatenation detected`)
  }

  checkedRoutes.push(rel.replace(/\\/g, "/"))
}

walk(join(root, "modules"))

const requiredModules = [
  "modules/reports/reports.route.js",
  "modules/audit/audit.route.js",
  "modules/search/search.route.js",
  "modules/ai/ai.route.js"
]

for (const modulePath of requiredModules) {
  if (!checkedRoutes.includes(modulePath)) {
    issues.push(`Missing route file: ${modulePath}`)
  }
}

console.log(`Security audit scanned ${checkedRoutes.length} route files`)

if (issues.length > 0) {
  console.error("Security audit findings:")
  for (const issue of issues) {
    console.error(`  - ${issue}`)
  }
  process.exit(1)
}

console.log("Security audit passed: auth middleware present, no obvious SQL injection patterns in routes")

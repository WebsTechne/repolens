const fs = require("fs")
const path = require("path")

function processDir(dir) {
  fs.readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) {
      processDir(p)
    } else if (f.endsWith(".js")) {
      // Fix internal require paths to use .cjs extension
      let content = fs.readFileSync(p, "utf8")
      content = content.replace(/require\("(\.[^"]+)"\)/g, (match, dep) => {
        if (!dep.endsWith(".cjs") && !dep.endsWith(".json")) {
          return `require("${dep}.cjs")`
        }
        return match
      })
      content = content.replace(/require\('(\.[^']+)'\)/g, (match, dep) => {
        if (!dep.endsWith(".cjs") && !dep.endsWith(".json")) {
          return `require('${dep}.cjs')`
        }
        return match
      })
      // Rename .js to .cjs
      const newPath = p.slice(0, -3) + ".cjs"
      fs.writeFileSync(newPath, content)
      fs.unlinkSync(p)
    }
  })
}

processDir("worker-dist")
console.log("Renamed worker-dist .js files to .cjs and patched require paths")

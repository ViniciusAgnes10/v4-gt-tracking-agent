import { promises as fs } from "node:fs";
import path from "node:path";
const required=["package.json","server/src/app.mjs","server/src/http.mjs","server/src/store.mjs","server/src/executor.mjs","web/tracking-console.html","data/state.json","README.md"];
let failed=false;
for(const file of required){try{const stat=await fs.stat(path.resolve(file));if(!stat.isFile())throw new Error("not a file");console.log(`PASS ${file}`)}catch(error){console.error(`FAIL ${file}: ${error.message}`);failed=true}}
const pkg=JSON.parse(await fs.readFile("package.json","utf8"));for(const dep of ["@modelcontextprotocol/sdk","@modelcontextprotocol/ext-apps","zod","express"]){if(!pkg.dependencies?.[dep]){console.error(`FAIL dependency ${dep}`);failed=true}else console.log(`PASS dependency ${dep}`)}
const html=await fs.readFile("web/tracking-console.html","utf8");for(const token of ["window.openai","callTool","requestDisplayMode","ui/notifications/tool-result"]){if(!html.includes(token)){console.error(`FAIL widget token ${token}`);failed=true}else console.log(`PASS widget token ${token}`)}
const app=await fs.readFile("server/src/app.mjs","utf8");const tools=[...app.matchAll(/registerAppTool\(server,\s*"([^"]+)"/g)].map(m=>m[1]);console.log(`INFO tools ${tools.length}: ${tools.join(", ")}`);if(tools.length<12){console.error("FAIL expected at least 12 tools");failed=true}
if(failed)process.exit(1);console.log("VALIDATION_OK");

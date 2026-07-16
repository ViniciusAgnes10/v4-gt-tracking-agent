import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { HEADERS, URI, tools, widget } from "./config.mjs";
import { callTool } from "./operations.mjs";
const json=(res,status,body)=>res.status(status).setHeader("content-type","application/json").send(JSON.stringify(body));
const same=(a,b)=>{const x=Buffer.from(String(a||"")),y=Buffer.from(String(b||""));return x.length>0&&x.length===y.length&&crypto.timingSafeEqual(x,y)};
const result=(id,data,error)=>error?{jsonrpc:"2.0",id,error}:{jsonrpc:"2.0",id,result:data};
const toolResult=(data,text,meta={})=>({structuredContent:data,content:[{type:"text",text}],_meta:meta});
export default async function handler(req,res){
 for(const[k,v]of Object.entries(HEADERS))res.setHeader(k,v);
 if(req.method==="OPTIONS")return res.status(204).end();
 const required=["SUPABASE_URL","SUPABASE_ANON_KEY","GT_AGENT_KEY","GT_TENANT_ID","MCP_ACCESS_TOKEN"];
 const missing=required.filter(k=>!process.env[k]);if(missing.length)return json(res,503,{error:"configuration_pending",missing});
 if(!same(req.query?.token,process.env.MCP_ACCESS_TOKEN))return json(res,401,{error:"unauthorized"});
 if(req.method==="GET")return json(res,200,{ok:true,service:"v4-gt-tracking-agent",storage:"supabase",executionMode:"dry_run",time:new Date().toISOString()});
 if(req.method!=="POST")return json(res,405,{error:"method_not_allowed"});
 const{id,method}=req.body||{},params=req.body?.params||{};
 try{
  if(method==="initialize")return json(res,200,result(id,{protocolVersion:params.protocolVersion||"2025-03-26",capabilities:{tools:{},resources:{}},serverInfo:{name:"v4-gt-tracking-agent",version:"3.0.0"},instructions:"Comece pelo Gate 1 em leitura. Exija aprovação antes de escritas externas."}));
  if(method==="notifications/initialized")return res.status(202).end();
  if(method==="ping")return json(res,200,result(id,{}));
  if(method==="tools/list")return json(res,200,result(id,{tools}));
  if(method==="resources/list")return json(res,200,result(id,{resources:[{uri:URI,name:"V4 GT Tracking Console",mimeType:"text/html;profile=mcp-app"}]}));
  if(method==="resources/read")return json(res,200,result(id,{contents:[{uri:URI,mimeType:"text/html;profile=mcp-app",text:widget,_meta:{ui:{prefersBorder:false,csp:{connectDomains:[],resourceDomains:[]}},"openai/widgetDescription":"Console operacional de tracking, CRM, aprovações e QA."}}]}));
  if(method!=="tools/call")return json(res,200,result(id,null,{code:-32601,message:"Method not found"}));
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false},global:{headers:{"x-agent-key":process.env.GT_AGENT_KEY}}});
  const data=await callTool(db,params.name,params.arguments||{});const meta=params.name==="render_tracking_console"?{ui:{resourceUri:URI},"openai/outputTemplate":URI}:{};
  return json(res,200,result(id,toolResult(data,params.name==="render_tracking_console"?"Console aberto.":"Operação concluída.",meta)));
 }catch(error){return json(res,200,result(id,null,{code:-32000,message:error instanceof Error?error.message:String(error)}))}
}

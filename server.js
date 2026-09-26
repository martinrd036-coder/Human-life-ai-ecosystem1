const path=require("path");
const express=require("express");
const {Pool}=require("pg");
const commandCenter=require("./command-center");
const {scoreOpportunity,buildExperimentPlan}=require("./opportunity-intelligence");
const {researchOpportunities}=require("./exa-research");
const {analyzeProduct}=require("./product-intelligence");
const {DEFAULT_RESEARCH_SOURCES,getResearchConfig}=require("./research");

const app=express(),PORT=process.env.PORT||3000,COOLDOWN=15*60*1000;
const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false
});

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

function buildRevenueIntelligence(results){
 return results
  .map(x=>{

   const item={
    id:x.url||x.title,
    title:x.title,
    url:x.url,
    description:x.description||"",
    revenueSource:"Research source",
    cost:"Not yet verified",
    riskNotes:"Requires independent verification before testing."
   };

   const intelligence=scoreOpportunity(item);
   const experiment=buildExperimentPlan(item);

   const priorityScore=Math.round(
    (intelligence.evidenceScore*0.6)+
    (intelligence.testabilityScore*0.4)
   );

   return{
    opportunity:x.title,
    source:x.url,
    evidence:x.description||null,

    priorityScore,
    evidenceScore:intelligence.evidenceScore,
    testabilityScore:intelligence.testabilityScore,
    confidenceBand:intelligence.confidenceBand,
    qualityGate:intelligence.qualityGate,
    sourceQuality:intelligence.sourceQuality,

    verificationChecks:intelligence.verificationChecks,

    businessModel:"Needs verification",
    targetCustomer:"Needs verification",
    startupCost:"Needs verification",
    difficulty:"Needs verification",
    monetizationPath:"Needs verification",

    firstTest:experiment.firstAction,
    successMetrics:experiment.successMetrics,
    stopRules:experiment.stopRules,

    revenueStatus:"No revenue claimed."
   };
  })
  .sort((a,b)=>b.priorityScore-a.priorityScore);
}
const agentRegistry=[
 ["agent1","Command Center","Central coordinator that assigns work, routes results, and maintains ecosystem state"],
 ["affiliate-intelligence","Affiliate Research","Research affiliate programs and provide verified program information to the appropriate specialist"],
 ["viral-content","Content Intelligence","Research trends, formats, audiences, hooks, and content opportunities"],
 ["revenue-intelligence","Revenue Intelligence","Research, validate, compare, and prioritize legitimate AI-powered revenue opportunities across the ecosystem"],
 ["analytics","Analytics & Evaluation","Measure agent activity, research quality, experiments, failures, and improvement signals"],
 ["opportunity-scout","Opportunity Scout","Discover legitimate evidence-backed revenue opportunities"],
 ["product-scout":
    "Find real Amazon products that can be promoted with an Amazon Associates product link. Search for specific physical products and direct Amazon product pages, including product name, Amazon URL, current product information, customer use cases, content potential, and relevant product details. Exclude Amazon Associates program pages, help pages, storefront pages, category pages, search-result pages, and general affiliate information. Return actual individual products only."],
 ["guardian","Guardian","Monitor ecosystem health, safety, failures, stale work, and protected operations"],
 ["engineering-guardian","Engineering Guardian","Monitor, diagnose, test, verify, and safely repair technical systems"]
].map(([id,name,purpose])=>({
 id,
 name,
 purpose,
 status:"not_reporting",
 lastActivity:"Waiting for heartbeat"
}));

let lastScoutRun=null;
let scoutRunning=false;
let automationRunning=false;

const FIRST_AUTOMATION_DELAY=30*1000;

const agent=id=>agentRegistry.find(a=>a.id===id);

async function init(){
  await pool.query(`
  CREATE TABLE IF NOT EXISTS opportunities(
   id TEXT PRIMARY KEY,
   title TEXT NOT NULL,
   revenue_source TEXT NOT NULL,
   url TEXT,
   description TEXT,
   estimated_potential TEXT,
   difficulty TEXT,
   cost TEXT,
   risk_notes TEXT,
   status TEXT NOT NULL,
   discovered_at TIMESTAMPTZ NOT NULL,
   evidence_score INTEGER,
   testability_score INTEGER,
   experiment_plan JSONB
  )
 `);

 await pool.query(`
  ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS evidence_score INTEGER,
  ADD COLUMN IF NOT EXISTS testability_score INTEGER,
  ADD COLUMN IF NOT EXISTS experiment_plan JSONB
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS agent_heartbeats(
   agent_id TEXT PRIMARY KEY,
   status TEXT NOT NULL,
   activity TEXT,
   last_heartbeat TIMESTAMPTZ NOT NULL
  )
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS agent_runs(
   id TEXT PRIMARY KEY,
   agent_id TEXT NOT NULL,
   status TEXT NOT NULL,
   activity TEXT,
   result JSONB,
   started_at TIMESTAMPTZ NOT NULL,
   completed_at TIMESTAMPTZ
  )
 `);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS command_assignments(
   id TEXT PRIMARY KEY,
   agent_id TEXT NOT NULL,
   task_name TEXT NOT NULL,
   details JSONB,
   status TEXT NOT NULL,
   assigned_at TIMESTAMPTZ NOT NULL,
   started_at TIMESTAMPTZ,
   completed_at TIMESTAMPTZ,
   result JSONB
  )
 `);
}

async function beat(id,status,activity){
 const t=new Date().toISOString();

 await pool.query(
  `INSERT INTO agent_heartbeats(
    agent_id,status,activity,last_heartbeat
   )
   VALUES($1,$2,$3,$4)
   ON CONFLICT(agent_id)
   DO UPDATE SET
    status=EXCLUDED.status,
    activity=EXCLUDED.activity,
    last_heartbeat=EXCLUDED.last_heartbeat`,
  [id,status,activity,t]
 );
}

async function agents(){
 const r=await pool.query(`
  SELECT
   agent_id,
   status,
   activity,
   last_heartbeat AS "lastHeartbeat"
  FROM agent_heartbeats
 `);

 const m=Object.fromEntries(
  r.rows.map(x=>[x.agent_id,x])
 );

 return agentRegistry.map(a=>
  m[a.id]
   ? {
      ...a,
      status:m[a.id].status,
      lastActivity:m[a.id].activity,
      lastHeartbeat:m[a.id].lastHeartbeat,
      heartbeat:"received"
     }
   : {
      ...a,
      status:"not_reporting",
      heartbeat:null
     }
 );
}

async function runLog(id,status,activity,result,start){
 await pool.query(
  `INSERT INTO agent_runs(
    id,
    agent_id,
    status,
    activity,
    result,
    started_at,
    completed_at
   )
   VALUES($1,$2,$3,$4,$5,$6,$7)`,
  [
   `run-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
   id,
   status,
   activity,
   JSON.stringify(result||{}),
   start,
   new Date().toISOString()
  ]
 );
}

async function scout(topic){
 if(scoutRunning){
  throw Object.assign(
   new Error("Opportunity Scout is already running."),
   {code:"busy"}
  );
 }

 if(
  lastScoutRun &&
  Date.now()-new Date(lastScoutRun).getTime()<COOLDOWN
 ){
  throw Object.assign(
   new Error("Opportunity Scout recently ran."),
   {
    code:"cooldown",
    lastRunAt:lastScoutRun
   }
  );
 }

 scoutRunning=true;

 const start=new Date().toISOString();

 await beat(
  "opportunity-scout",
  "running",
  "Research scan started"
 );

 try{
  const r=await researchOpportunities(
   topic||
   "legitimate ways to make money online through AI automation, affiliate programs, creator programs, freelance work, remote jobs, digital products, and reputable opportunities"
  );

const items=r.results.map((x,i)=>{
  const id=`opp-${Date.now()}-${i}`;

  const item={
    id,
    title:x.title,
    revenueSource:x.source||"Research source",
    url:x.url||null,
    description:x.description||null,
    estimatedPotential:"Unknown",
    difficulty:"Unknown",
    cost:"Unknown",
    riskNotes:"Verify terms and eligibility before acting.",
    status:"new",
    discoveredAt:new Date().toISOString()
  };

  const intelligence=scoreOpportunity(item);

  return{
    ...item,
    evidenceScore:intelligence.evidenceScore,
    testabilityScore:intelligence.testabilityScore,
    experimentPlan:buildExperimentPlan(item)
  };
});

  for(const x of items){
   await pool.query(
    `INSERT INTO opportunities(
  id,
  title,
  revenue_source,
  url,
  description,
  estimated_potential,
  difficulty,
  cost,
  risk_notes,
  status,
  discovered_at,
  evidence_score,
  testability_score,
  experiment_plan
     )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT(id) DO NOTHING`,
    [
     x.id,
     x.title,
     x.revenueSource,
     x.url,
     x.description,
     x.estimatedPotential,
     x.difficulty,
     x.cost,
     x.riskNotes,
     x.status,
     x.discoveredAt,
     x.evidenceScore,
     x.testabilityScore,
     x.experimentPlan
    ]
   );
  }

  lastScoutRun=new Date().toISOString();

  const activity=
   `Research scan completed: ${items.length} opportunities found and saved`;

  await beat(
   "opportunity-scout",
   "online",
   activity
  );

  await runLog(
   "opportunity-scout",
   "completed",
   activity,
   {
    found:items.length,
    saved:items.length
   },
   start
  );

  return{
   found:items.length,
   saved:items.length,
   opportunities:items,
   searchedAt:r.searchedAt
  };

 }catch(e){

  const activity=`Research scan failed: ${e.message}`;

  await beat(
   "opportunity-scout",
   "error",
   activity
  );

  await runLog(
   "opportunity-scout",
   "failed",
   activity,
   {error:e.message},
   start
  );

  throw e;

 }finally{
  scoutRunning=false;
 }
}

async function work(id,details={}){
 if(!agent(id)){
  throw Object.assign(
   new Error("Agent not found"),
   {code:"not_found"}
  );
 }

 if(id==="opportunity-scout"){
  return scout(details.topic);
 }

 const start=new Date().toISOString();

 await beat(
  id,
  "running",
  "Work started"
 );

 let result={};

 try{

  const queries={
   "affiliate-intelligence":
    "official affiliate programs legitimate current requirements commissions",

    "product-scout":
    "Find actual Amazon product candidates with specific product names, product pages, current product information, customer use cases, creator content potential, and legitimate affiliate eligibility. Return actual products, not general Amazon affiliate information pages",
   
   "viral-content":
 "current content trends video ideas creator opportunities reputable sources",

   "revenue-intelligence":
    "legitimate AI-powered online revenue opportunities, automation businesses, affiliate models, digital products, creator monetization, freelance services, lead generation, and emerging platforms. Return evidence-backed opportunities with business model, target customer, startup cost, difficulty, monetization path, verification sources, first test, success metrics, and stop rules"
    };

  if(queries[id]){

   const r=await researchOpportunities(
    details.topic||queries[id]
   );
result={
  found:r.results.length,
  titles:r.results
   .slice(0,5)
   .map(x=>x.title),
  results:id==="product-scout"
   ?r.results.map(x=>({
      ...x,
      productIntelligence:analyzeProduct(x)
     }))
   :id==="revenue-intelligence"
   ?buildRevenueIntelligence(r.results)
   :r.results,
  searchedAt:r.searchedAt,
  query:r.query
};

  }else if(id==="analytics"){

   const o=await pool.query(
    "SELECT COUNT(*)::int AS count FROM opportunities"
   );

   const runs=await pool.query(
    "SELECT COUNT(*)::int AS count FROM agent_runs"
   );

   result={
    savedOpportunities:o.rows[0].count,
    recordedRuns:runs.rows[0].count
   };

  }else if(id==="guardian"){

   await pool.query("SELECT NOW()");

   const o=await pool.query(
    "SELECT COUNT(*)::int AS count FROM opportunities"
   );

   result={
    database:"healthy",
    opportunities:o.rows[0].count
   };

  }else if(id==="engineering-guardian"){

   await pool.query("SELECT NOW()");

   result={
    server:"healthy",
    database:"reachable",
    exaConfigured:Boolean(process.env.EXA_API_KEY)
   };

  }else{

   result={
    message:"Command Center connected."
   };
  }

  const activity=
   `Work completed: ${agent(id).name}`;

  await beat(
   id,
   "online",
   activity
  );

  await runLog(
   id,
   "completed",
   activity,
   result,
   start
  );

  return result;

 }catch(e){

  const activity=
   `Work failed: ${e.message}`;

  await beat(
   id,
   "error",
   activity
  );

  await runLog(
   id,
   "failed",
   activity,
   {error:e.message},
   start
  );

  throw e;
 }
}

/* =========================================================
   CONTINUOUS COMMAND CENTER AUTOMATION
   ========================================================= */

async function runAutomationCycle(){

 if(automationRunning){
  console.log("Automation cycle skipped: another cycle is running.");
  return{
   status:"skipped",
   reason:"automation_already_running"
  };
 }

 automationRunning=true;

 try{

  const currentAgents=await agents();

  const agentId=
   commandCenter.nextAutomatedAgent(
    currentAgents
   );

  if(!agentId){

   const result={
    status:"skipped",
    reason:"no_agent_available"
   };

   commandCenter.recordAutomation({
    ...result,
    message:"Automation cycle skipped: no agent available."
   });

   return result;
  }

  const target=agent(agentId);

  if(!target){

   const result={
    status:"skipped",
    reason:"agent_not_found"
   };

   commandCenter.recordAutomation({
    ...result,
    message:`Automation cycle skipped: ${agentId} not found.`
   });

   return result;
  }

  const current=
   currentAgents.find(
    a=>a.id===agentId
   );

  if(
   current &&
   current.status==="running"
  ){

   const result={
    status:"skipped",
    agentId,
    reason:"agent_already_running"
   };

   commandCenter.recordAutomation({
    ...result,
    message:`Automation skipped ${target.name}: already running.`
   });

   return result;
  }

  await beat(
   "agent1",
   "online",
   `Command Center assigning automated work to ${target.name}`
  );

  const assignment=
   commandCenter.assignTask(
    agentId,
    target.purpose,
    {
     source:"continuous-command-center",
     automatic:true
    }
   );

  await pool.query(
   `INSERT INTO command_assignments(
    id,
    agent_id,
    task_name,
    details,
    status,
    assigned_at,
    started_at
   )
   VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [
    assignment.id,
    assignment.agentId,
    assignment.taskName,
    assignment.details,
    "assigned",
    assignment.assignedAt,
    null
   ]
  );

  commandCenter.startTask(assignment.id);

  await pool.query(
   `UPDATE command_assignments
    SET status=$1,
        started_at=$2
    WHERE id=$3`,
   [
    "running",
    new Date().toISOString(),
    assignment.id
   ]
  );

  try{

   const result=
    await work(agentId,{});

    commandCenter.completeTask(
    assignment.id,
    result
   );

   await pool.query(
    `UPDATE command_assignments
     SET status=$1,
         completed_at=$2,
         result=$3
     WHERE id=$4`,
    [
     "completed",
     new Date().toISOString(),
     result,
     assignment.id
    ]
   );

   commandCenter.recordAutomation({
    status:"completed",
    agentId,
    result,
    message:
     `Automated work completed: ${target.name}.`
   });

   await beat(
    "agent1",
    "online",
    `Automated work completed: ${target.name}`
   );

   console.log(
    `Automation: completed ${target.name}`
   );

   return{
    status:"completed",
    agentId,
    result
   };

  }catch(e){

   commandCenter.failTask(
    assignment.id,
    e.message
   );

   commandCenter.recordAutomation({
    status:"failed",
    agentId,
    error:e.message,
    message:
     `Automated work failed: ${target.name}: ${e.message}`
   });

   await beat(
    "agent1",
    "online",
    `Automated work failed: ${target.name}`
   );

   console.error(
    `Automation: ${target.name} failed:`,
    e.message
   );

   return{
    status:"failed",
    agentId,
    error:e.message
   };
  }

 }catch(e){

  console.error(
   "Automation cycle error:",
   e
  );

  commandCenter.recordAutomation({
   status:"failed",
   error:e.message,
   message:
    `Command Center automation error: ${e.message}`
  });

  return{
   status:"failed",
   error:e.message
  };

 }finally{

  automationRunning=false;
 }
}

function startAutomation(){

 console.log(
  "Command Center continuous automation starting."
 );

 console.log(
  "First automated agent run scheduled in 30 seconds."
 );

 setTimeout(async function automationLoop(){

  try{
   await runAutomationCycle();
  }catch(e){
   console.error(
    "Unexpected automation loop error:",
    e
   );
  }

  setTimeout(
   automationLoop,
   commandCenter.getAutomationIntervalMinutes()*60*1000
  );

 },FIRST_AUTOMATION_DELAY);
}

/* =========================================================
   ROUTES
   ========================================================= */

app.get("/health",async(req,res)=>{
 try{

  await pool.query("SELECT 1");

  res.json({
   status:"online",
   service:"Human Life AI Ecosystem",
   database:"healthy",
   automation:"enabled"
  });

 }catch(e){

  res.status(503).json({
   status:"error",
   database:"unavailable",
   message:e.message
  });
 }
});

app.get("/api/command-center/status",async(req,res)=>{
 try{

  const a=await agents();

  res.json({
   ...commandCenter.getStatus(a),
   agents:a
  });

 }catch(e){

  res.status(500).json({
   status:"error",
   message:e.message
  });
 }
});

app.post("/api/command-center/cycle",async(req,res)=>{
 try{

  await beat(
   "agent1",
   "online",
   "Command Center cycle running"
  );

  const a=await agents();

  res.json({
   status:"success",
   cycle:commandCenter.runCycle(a)
  });

 }catch(e){

  res.status(500).json({
   status:"error",
   message:e.message
  });
 }
});

app.post("/api/command-center/assign",(req,res)=>{

 const{
  agentId,
  taskName,
  details
 }=req.body;

 if(!agent(agentId)||!taskName){

  return res.status(400).json({
   error:"Valid agentId and taskName are required"
  });
 }

 res.json({
  status:"assigned",
  assignment:
   commandCenter.assignTask(
    agentId,
    taskName,
    details||{}
   )
 });
});

app.post("/api/command-center/complete",(req,res)=>{

 const a=
  commandCenter.completeTask(
   req.body.assignmentId,
   req.body.result||{}
  );
  
 if(!a){

  return res.status(404).json({
   error:"Assignment not found"
  });
 }

 res.json({
  status:"completed",
  assignment:a
 });
});

app.post("/api/command-center/fail",(req,res)=>{

 const a=
  commandCenter.failTask(
   req.body.assignmentId,
   req.body.errorMessage||"Unknown error"
  );

 if(!a){

  return res.status(404).json({
   error:"Assignment not found"
  });
 }

 res.json({
  status:"failed",
  assignment:a
 });
});

app.post("/api/agents/heartbeat",async(req,res)=>{
 try{

  if(!agent(req.body.agentId)){

   return res.status(404).json({
    status:"error",
    message:"Agent not found"
   });
  }

  await beat(
   req.body.agentId,
   req.body.status||"online",
   req.body.activity||"Heartbeat received"
  );

  res.json({
   status:"heartbeat_received",
   agent:agent(req.body.agentId)
  });

 }catch(e){

  res.status(500).json({
   status:"error",
   message:e.message
  });
 }
});
app.get("/api/product-scout/results",async(req,res)=>{
 try{

  const r=await pool.query(`
   SELECT
    started_at AS "startedAt",
    result
   FROM agent_runs
   WHERE agent_id='product-scout'
     AND status='completed'
   ORDER BY started_at DESC
   LIMIT 1
  `);

  if(r.rows.length===0){
   return res.json({
    status:"ready",
    agent:"Product Scout",
    found:0,
    results:[],
    message:"No completed Product Scout research run has been recorded yet."
   });
  }

  const run=r.rows[0];

  res.json({
   status:"ready",
   agent:"Product Scout",
   startedAt:run.startedAt,
   found:run.result?.found||0,
   query:run.result?.query||"",
   searchedAt:run.result?.searchedAt||null,
   results:Array.isArray(run.result?.results)
    ?run.result.results
    :[]
  });

 }catch(e){

  res.status(500).json({
   status:"error",
   message:e.message
  });
 }
});
app.get("/api/agents/status",async(req,res)=>{
 try{

  const a=await agents();

  const r=await pool.query(`
   SELECT
    agent_id AS "agentId",
    status,
    activity,
    started_at AS "startedAt",
    completed_at AS "completedAt",
    result
   FROM agent_runs
   ORDER BY started_at DESC
   LIMIT 50
  `);

  res.json({
   status:"online",
   totalAgents:a.length,
   reportingAgents:
    a.filter(
     x=>x.status==="online"||x.status==="running"
    ).length,
   agents:a,
   recentRuns:r.rows
  });

 }catch(e){

  res.status(500).json({
   status:"error",
   message:e.message
  });
 }
});

app.post("/api/agents/run",async(req,res)=>{
 try{

  res.json({
   status:"success",
   agentId:req.body.agentId,
   result:
    await work(
     req.body.agentId,
     req.body.details||{}
    )
  });

 }catch(e){

  res.status(
   e.code==="busy"
    ?409
    :e.code==="cooldown"
     ?429
     :e.code==="not_found"
      ?404
      :500
  ).json({
   status:"error",
   message:e.message,
   lastRunAt:e.lastRunAt||null
  });
 }
});

app.get("/api/agent1/status",(req,res)=>
 res.json({
  status:"online",
  agent:agent("agent1")
 })
);

app.get("/api/guardian/status",(req,res)=>
 res.json({
  status:"online",
  guardian:agent("guardian"),
  engineeringGuardian:
   agent("engineering-guardian")
 })
);

app.post("/api/opportunity-scout/run",async(req,res)=>{
 try{

  res.json({
   status:"success",
   ...(await scout(req.body?.topic))
  });

 }catch(e){

  res.status(
   e.code==="busy"
    ?409
    :e.code==="cooldown"
     ?429
     :500
  ).json({
   status:"error",
   message:e.message,
   lastRunAt:
    e.lastRunAt||lastScoutRun
  });
 }
});

app.get("/api/opportunities",async(req,res)=>{
 try{

  const r=await pool.query(`
   SELECT
    id,
    title,
    revenue_source AS "revenueSource",
    url,
    description,
    estimated_potential AS "estimatedPotential",
    difficulty,
    cost,
    risk_notes AS "riskNotes",
    status,
    discovered_at AS "discoveredAt",
 evidence_score AS "evidenceScore",
testability_score AS "testabilityScore",
experiment_plan AS "experimentPlan"
   FROM opportunities
   ORDER BY discovered_at DESC
   LIMIT 100
  `);

  res.json({
   status:"ready",
   agent:"Opportunity Scout",
   opportunities:r.rows
  });

 }catch(e){

  res.status(500).json({
   status:"error",
   message:e.message
  });
 }
});

app.get("/api/opportunities/status",async(req,res)=>{
 try{

  const a=
   (await agents()).find(
    x=>x.id==="opportunity-scout"
   );

  const r=await pool.query(`
   SELECT
    id,
    title,
    revenue_source AS "revenueSource",
    url,
    description,
    estimated_potential AS "estimatedPotential",
    difficulty,
    cost,
    risk_notes AS "riskNotes",
    status,
    discovered_at AS "discoveredAt",
evidence_score AS "evidenceScore",
testability_score AS "testabilityScore",
experiment_plan AS "experimentPlan"
   FROM opportunities
   ORDER BY discovered_at DESC
   LIMIT 100
  `);

  res.json({
   status:a.status,
   agent:a,
   lastRunAt:lastScoutRun,
   running:scoutRunning,
   opportunities:r.rows
  });

 }catch(e){

  res.status(500).json({
   status:"error",
   message:e.message
  });
 }
});

app.post("/api/opportunities",async(req,res)=>{

 if(
  !req.body.title||
  !req.body.revenueSource
 ){

  return res.status(400).json({
   status:"error",
   message:
    "An opportunity must have a title and revenue source."
  });
 }
try{
const x={
  id:`opp-${Date.now()}`,
  title:req.body.title,
  revenueSource:req.body.revenueSource,
  url:req.body.url||null,
  description:req.body.description||null,
  estimatedPotential:
    req.body.estimatedPotential||"Unknown",
  difficulty:
    req.body.difficulty||"Unknown",
  cost:req.body.cost||"Unknown",
  riskNotes:
    req.body.riskNotes||
    "Verify terms and eligibility before acting.",
  status:"new",
  discoveredAt:new Date().toISOString()
};

 const intelligence=scoreOpportunity(x);

x.evidenceScore=intelligence.evidenceScore;
x.testabilityScore=intelligence.testabilityScore;
x.experimentPlan=buildExperimentPlan(x);

  await pool.query(
  `INSERT INTO opportunities(
    id,
    title,
    revenue_source,
    url,
    description,
    estimated_potential,
    difficulty,
    cost,
    risk_notes,
    status,
    discovered_at,
    evidence_score,
    testability_score,
    experiment_plan
  )
  VALUES(
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
  )
  ON CONFLICT(id) DO NOTHING`,
  [
    x.id,
    x.title,
    x.revenueSource,
    x.url,
    x.description,
    x.estimatedPotential,
    x.difficulty,
    x.cost,
    x.riskNotes,
    x.status,
    x.discoveredAt,
    x.evidenceScore,
    x.testabilityScore,
    x.experimentPlan
  ]
);

  res.status(201).json({
   status:"created",
   opportunity:x
  });

 }catch(e){

  res.status(500).json({
   status:"error",
   message:e.message
  });
 }
});

app.get("/api/research/config",(req,res)=>{

 const c=getResearchConfig();

 res.json({
  status:"ready",
  provider:c.provider,
  apiKeyConfigured:c.apiKeyConfigured,
  sources:DEFAULT_RESEARCH_SOURCES
 });
});

app.get("/",(req,res)=>
 res.sendFile(
  path.join(
   __dirname,
   "public",
   "index.html"
  )
));

/* =========================================================
   START SERVER
   ========================================================= */

init()
 .then(()=>{

  app.listen(
   PORT,
   "0.0.0.0",
   ()=>{

    console.log(
     `Human Life AI Ecosystem running on port ${PORT}`
    );

    startAutomation();
   }
  );

 })
 .catch(e=>{

  console.error(
   "Database initialization failed:",
   e
  );

  process.exit(1);
 });

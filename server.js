const path=require("path");
const express=require("express");
const {Pool}=require("pg");

const commandCenter=require("./command-center");

const {
 scoreOpportunity,
 buildExperimentPlan
}=require("./opportunity-intelligence");

const {
 researchOpportunities
}=require("./exa-research");

const {
 analyzeProduct
}=require("./product-intelligence");

const {
 DEFAULT_RESEARCH_SOURCES,
 getResearchConfig
}=require("./research");

const {
 buildAmazonSpecialLink,
 initAmazonAffiliate,
 recordAmazonClick,
 getAmazonClickStats
}=require("./amazon-affiliate");

const app=express();

const PORT=
 process.env.PORT||3000;

const COOLDOWN=
 15*60*1000;

const pool=new Pool({
 connectionString:
  process.env.DATABASE_URL,
 ssl:
  process.env.DATABASE_URL
   ?{rejectUnauthorized:false}
   :false
});

app.use(express.json());

app.use(
 express.static(
  path.join(__dirname,"public")
 )
);

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
  CREATE TABLE IF NOT EXISTS product_candidates(
   id TEXT PRIMARY KEY,
   product_name TEXT NOT NULL,
   product_url TEXT UNIQUE NOT NULL,
   source TEXT,
   description TEXT,
   verification_status TEXT,
   affiliate_status TEXT,
   content_angles JSONB,
   revenue_status TEXT NOT NULL,
   discovered_at TIMESTAMPTZ NOT NULL
  )
 `);

 await pool.query(`
  ALTER TABLE product_candidates
  ADD COLUMN IF NOT EXISTS qualification TEXT,
  ADD COLUMN IF NOT EXISTS qualification_score INTEGER,
  ADD COLUMN IF NOT EXISTS qualification_checks JSONB,
  ADD COLUMN IF NOT EXISTS evidence JSONB,
  ADD COLUMN IF NOT EXISTS recommended_action TEXT,
  ADD COLUMN IF NOT EXISTS verification_checks JSONB,
  ADD COLUMN IF NOT EXISTS test_plan JSONB
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

 await initAmazonAffiliate(pool);
}
const agentRegistry=[
 {
  id:"agent1",
  name:"Command Center",
  purpose:
   "Central coordinator that assigns work, routes results, and maintains ecosystem state"
 },
 {
  id:"affiliate-intelligence",
  name:"Affiliate Research",
  purpose:
   "Research legitimate affiliate programs and provide verified program information"
 },
 {
  id:"viral-content",
  name:"Content Intelligence",
  purpose:
   "Research trends, audiences, hooks, content opportunities, and traffic strategies"
 },
 {
  id:"revenue-intelligence",
  name:"Revenue Intelligence",
  purpose:
   "Research, validate, compare, and prioritize legitimate online revenue opportunities"
 },
 {
  id:"analytics",
  name:"Analytics & Evaluation",
  purpose:
   "Measure agent activity, research quality, experiments, failures, and improvement signals"
 },
 {
  id:"opportunity-scout",
  name:"Opportunity Scout",
  purpose:
   "Discover legitimate evidence-backed revenue opportunities"
 },
 {
  id:"product-scout",
  name:"Product Scout",
  purpose:
   "Find real Amazon products that can be promoted with Amazon Associates product links"
 },
 {
  id:"guardian",
  name:"Guardian",
  purpose:
   "Monitor ecosystem health, safety, failures, stale work, and protected operations"
 },
 {
  id:"engineering-guardian",
  name:"Engineering Guardian",
  purpose:
   "Monitor, diagnose, test, verify, and safely repair technical systems"
 }
].map(a=>({
 ...a,
 status:"not_reporting",
 lastActivity:"Waiting for heartbeat"
}));

let lastScoutRun=null;

let scoutRunning=false;

let automationRunning=false;

const FIRST_AUTOMATION_DELAY=
 30*1000;

const agent=id=>
 agentRegistry.find(
  a=>a.id===id
 );

async function beat(
 id,
 status,
 activity
){
 const t=
  new Date().toISOString();

 await pool.query(
  `
  INSERT INTO agent_heartbeats(
   agent_id,
   status,
   activity,
   last_heartbeat
  )
  VALUES($1,$2,$3,$4)

  ON CONFLICT(agent_id)
  DO UPDATE SET
   status=EXCLUDED.status,
   activity=EXCLUDED.activity,
   last_heartbeat=EXCLUDED.last_heartbeat
  `,
  [
   id,
   status,
   activity,
   t
  ]
 );
}

async function agents(){

 const r=
  await pool.query(`
   SELECT
    agent_id,
    status,
    activity,
    last_heartbeat AS "lastHeartbeat"
   FROM agent_heartbeats
  `);

 const m=
  Object.fromEntries(
   r.rows.map(
    x=>[x.agent_id,x]
   )
  );

 return agentRegistry.map(a=>
  m[a.id]
   ?{
     ...a,
     status:m[a.id].status,
     lastActivity:m[a.id].activity,
     lastHeartbeat:
      m[a.id].lastHeartbeat,
     heartbeat:"received"
    }
   :{
     ...a,
     status:"not_reporting",
     heartbeat:null
    }
 );
}
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
    riskNotes:
     "Requires independent verification before testing."
   };

   const intelligence=
    scoreOpportunity(item);

   const experiment=
    buildExperimentPlan(item);

   const priorityScore=
    Math.round(
     (intelligence.evidenceScore*0.6)+
     (intelligence.testabilityScore*0.4)
    );

   return{
    opportunity:x.title,
    source:x.url,
    evidence:x.description||null,

    priorityScore,

    evidenceScore:
     intelligence.evidenceScore,

    testabilityScore:
     intelligence.testabilityScore,

    confidenceBand:
     intelligence.confidenceBand,

    qualityGate:
     intelligence.qualityGate,

    sourceQuality:
     intelligence.sourceQuality,

    verificationChecks:
     intelligence.verificationChecks,

    businessModel:
     "Needs verification",

    targetCustomer:
     "Needs verification",

    startupCost:
     "Needs verification",

    difficulty:
     "Needs verification",

    monetizationPath:
     "Needs verification",

    firstTest:
     experiment.firstAction,

    successMetrics:
     experiment.successMetrics,

    stopRules:
     experiment.stopRules,

    revenueStatus:
     "No revenue claimed."
   };
  })
  .sort(
   (a,b)=>
    b.priorityScore-
    a.priorityScore
  );
}
async function scout(topic){

 if(scoutRunning){
  throw Object.assign(
   new Error(
    "Opportunity Scout is already running."
   ),
   {code:"busy"}
  );
 }

 if(
  lastScoutRun &&
  Date.now()-
   new Date(lastScoutRun).getTime()
   <COOLDOWN
 ){
  throw Object.assign(
   new Error(
    "Opportunity Scout recently ran."
   ),
   {
    code:"cooldown",
    lastRunAt:lastScoutRun
   }
  );
 }

 scoutRunning=true;

 const start=
  new Date().toISOString();

 await beat(
  "opportunity-scout",
  "running",
  "Research scan started"
 );

 try{

  const r=
   await researchOpportunities(
    topic||
    "legitimate ways to make money online through AI automation, affiliate programs, creator programs, freelance work, remote jobs, digital products, and reputable opportunities"
   );

  const items=
   r.results.map((x,i)=>{

    const id=
     `opp-${Date.now()}-${i}`;

    const item={
     id,
     title:x.title,
     revenueSource:
      x.source||"Research source",
     url:x.url||null,
     description:
      x.description||null,
     estimatedPotential:
      "Unknown",
     difficulty:
      "Unknown",
     cost:
      "Unknown",
     riskNotes:
      "Verify terms and eligibility before acting.",
     status:"new",
     discoveredAt:
      new Date().toISOString()
    };

    const intelligence=
     scoreOpportunity(item);

    return{
     ...item,
     evidenceScore:
      intelligence.evidenceScore,
     testabilityScore:
      intelligence.testabilityScore,
     experimentPlan:
      buildExperimentPlan(item)
    };
   });

  for(const x of items){

   await pool.query(
    `
    INSERT INTO opportunities(
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
     $1,$2,$3,$4,$5,$6,$7,
     $8,$9,$10,$11,$12,$13,$14
    )
    ON CONFLICT(id)
    DO NOTHING
    `,
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

  lastScoutRun=
   new Date().toISOString();

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

  const activity=
   `Research scan failed: ${e.message}`;

  await beat(
   "opportunity-scout",
   "error",
   activity
  );

  await runLog(
   "opportunity-scout",
   "failed",
   activity,
   {
    error:e.message
   },
   start
  );

  throw e;

 }finally{

  scoutRunning=false;
 }
}
async function runLog(
 id,
 status,
 activity,
 result,
 start
){
 await pool.query(
  `
  INSERT INTO agent_runs(
   id,
   agent_id,
   status,
   activity,
   result,
   started_at,
   completed_at
  )
  VALUES($1,$2,$3,$4,$5,$6,$7)
  `,
  [
   `run-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2,7)}`,
   id,
   status,
   activity,
   JSON.stringify(result||{}),
   start,
   new Date().toISOString()
  ]
 );
}

function cleanProductDescription(
 value=""
){

 let text=
  String(value||"");

 text=text
  .replace(
   /\r\n|\n|\r|\t/g,
   " "
  )
  .replace(
   /<script[\s\S]*?<\/script>/gi,
   " "
  )
  .replace(
   /<style[\s\S]*?<\/style>/gi,
   " "
  );

 const garbageMarkers=[
  "var ue_",
  "window.",
  "document.",
  "function(",
  "function (",
  "setInterval(",
  "setTimeout(",
  "Amazon.com, Inc.",
  "DOWNGRADED",
  "FATAL",
  "ERROR",
  "WARN",
  "logLevel",
  "ue_err",
  "ue_sid",
  "ue_mid",
  "ue_furl",
  "ue_url"
 ];

 let cutIndex=
  text.length;

 for(
  const marker of garbageMarkers
 ){

  const index=
   text.indexOf(marker);

  if(
   index>80 &&
   index<cutIndex
  ){
   cutIndex=index;
  }
 }

 text=
  text.slice(0,cutIndex);

 const boilerplateMarkers=[
  "Click the button below to continue shopping",
  "Conditions of Use",
  "Privacy Notice",
  "Your California Privacy Rights",
  "© 1996-2025, Amazon.com, Inc.",
  "© 1996-2026, Amazon.com, Inc."
 ];

 for(
  const marker of boilerplateMarkers
 ){

  const index=
   text.indexOf(marker);

  if(index>40){
   text=
    text.slice(0,index);
  }
 }

 return text
  .replace(/\s+/g," ")
  .trim()
  .slice(0,5000);
}

async function work(
 id,
 details={}
){

 if(!agent(id)){
  throw Object.assign(
   new Error("Agent not found"),
   {code:"not_found"}
  );
 }

 if(
  id==="opportunity-scout"
 ){
  return scout(
   details.topic
  );
 }

 const start=
  new Date().toISOString();

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
    "Find current legitimate content and traffic opportunities for promoting products with affiliate links. Research TikTok, YouTube Shorts, Pinterest, search-driven content, product demonstrations, comparisons, problem-solution videos, seasonal demand, trending topics, strong hooks, and strategies that can work for creators with small or new audiences. Return evidence-backed opportunities with source, content angle, target audience, platform, hook idea, traffic strategy, and measurable success metrics. Do not assume the creator already has a large audience.",

   "revenue-intelligence":
    "legitimate AI-powered online revenue opportunities, automation businesses, affiliate models, digital products, creator monetization, freelance services, lead generation, and emerging platforms. Return evidence-backed opportunities with business model, target customer, startup cost, difficulty, monetization path, verification sources, first test, success metrics, and stop rules"
  };

  if(queries[id]){

   const r=
    await researchOpportunities(
     details.topic||
     queries[id]
    );

   const productResults=
    id==="product-scout"
     ?r.results.filter(x=>{

       const url=
        (x.url||"").toLowerCase();

       const title=
        (x.title||"").toLowerCase();

       const directProduct=
        /amazon\.com\/dp\/[a-z0-9]{10}/i
         .test(url)||
        /amazon\.com\/gp\/product\/[a-z0-9]{10}/i
         .test(url);

       const blocked=
        /\/(help|stores|gp\/browse|s|hz)\//i
         .test(url)||
        /associates|affiliate-program|application review|affiliate information/i
         .test(title+" "+url);

       return(
        directProduct&&
        !blocked
       );
      })
     :r.results;

   result={
    found:
     productResults.length,

    titles:
     productResults
      .slice(0,5)
      .map(x=>x.title),

    results:
     id==="product-scout"
      ?productResults.map(x=>{

       const cleaned={
        ...x,
        description:
         cleanProductDescription(
          x.description
         )
       };

       return{
        ...cleaned,
        productIntelligence:
         analyzeProduct(cleaned)
       };
      })
      :id==="revenue-intelligence"
       ?buildRevenueIntelligence(
         r.results
        )
       :r.results,

    searchedAt:r.searchedAt,
    query:r.query
   };

  }else if(
   id==="analytics"
  ){

   const o=
    await pool.query(
     "SELECT COUNT(*)::int AS count FROM opportunities"
    );

   const runs=
    await pool.query(
     "SELECT COUNT(*)::int AS count FROM agent_runs"
    );

   result={
    savedOpportunities:
     o.rows[0].count,

    recordedRuns:
     runs.rows[0].count
   };

  }else if(
   id==="guardian"
  ){

   await pool.query(
    "SELECT NOW()"
   );

   const o=
    await pool.query(
     "SELECT COUNT(*)::int AS count FROM opportunities"
    );

   result={
    database:"healthy",
    opportunities:
     o.rows[0].count
   };

  }else if(
   id==="engineering-guardian"
  ){

   await pool.query(
    "SELECT NOW()"
   );

   result={
    server:"healthy",
    database:"reachable",
    exaConfigured:
     Boolean(
      process.env.EXA_API_KEY
     )
   };

  }else{

   result={
    message:
     "Command Center connected."
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
   {
    error:e.message
   },
   start
  );

  throw e;
 }
   }
async function saveProductCandidates(
 result
){

 if(
  !result||
  !Array.isArray(result.results)
 ){
  return;
 }

 for(
  const item of result.results
 ){

  const pi=
   item.productIntelligence||
   {};

  if(!pi.sourceUrl){
   continue;
  }

  await pool.query(
   `
   INSERT INTO product_candidates(
    id,
    product_name,
    product_url,
    source,
    description,
    verification_status,
    affiliate_status,
    content_angles,
    revenue_status,
    discovered_at,
    qualification,
    qualification_score,
    qualification_checks,
    evidence,
    recommended_action,
    verification_checks,
    test_plan
   )
   VALUES(
    $1,$2,$3,$4,$5,$6,$7,$8,$9,
    $10,$11,$12,$13,$14,$15,$16,$17
   )
   ON CONFLICT(product_url)
   DO UPDATE SET
    product_name=
     EXCLUDED.product_name,
    source=
     EXCLUDED.source,
    description=
     EXCLUDED.description,
    verification_status=
     EXCLUDED.verification_status,
    affiliate_status=
     EXCLUDED.affiliate_status,
    content_angles=
     EXCLUDED.content_angles,
    revenue_status=
     EXCLUDED.revenue_status,
    qualification=
     EXCLUDED.qualification,
    qualification_score=
     EXCLUDED.qualification_score,
    qualification_checks=
     EXCLUDED.qualification_checks,
    evidence=
     EXCLUDED.evidence,
    recommended_action=
     EXCLUDED.recommended_action,
    verification_checks=
     EXCLUDED.verification_checks,
    test_plan=
     EXCLUDED.test_plan
   `,
   [
    `product-${Date.now()}-${Math.random()
     .toString(36)
     .slice(2,7)}`,

    pi.productName||
     item.title||
     "Unknown product",

    pi.sourceUrl,

    pi.source||
     item.source||
     "Amazon",

    item.description||
     "",

    pi.verificationStatus||
     "needs_product_verification",

    pi.affiliateStatus||
     "Not verified — human verification required.",

    JSON.stringify(
     pi.contentAngles||[]
    ),

    pi.revenueStatus||
     "No revenue claimed.",

    new Date().toISOString(),

    pi.qualification||
     "NEEDS_VERIFICATION",

    Number.isFinite(
     pi.qualificationScore
    )
     ?pi.qualificationScore
     :0,

    JSON.stringify(
     pi.qualificationChecks||[]
    ),

    JSON.stringify(
     pi.evidence||[]
    ),

    pi.recommendedAction||
     "Verify product evidence before promotion testing.",

    JSON.stringify(
     pi.verificationChecks||[]
    ),

    JSON.stringify(
     pi.testPlan||{}
    )
   ]
  );
 }
}
async function runProductScout(
 details={}
){

 const start=
  new Date().toISOString();

 await beat(
  "product-scout",
  "running",
  "Searching for Amazon product candidates"
 );

 try{

  const r=
   await researchOpportunities(
    details.topic||
    "Find actual Amazon products with direct Amazon product pages, useful customer problems, clear use cases, content potential, and evidence that can support legitimate product research. Return specific products, not affiliate-program information."
   );

  const productResults=
   r.results.filter(x=>{

    const url=
     (x.url||"").toLowerCase();

    const title=
     (x.title||"").toLowerCase();

    const directProduct=
     /amazon\.com\/dp\/[a-z0-9]{10}/i
      .test(url)||
     /amazon\.com\/gp\/product\/[a-z0-9]{10}/i
      .test(url);

    const blocked=
     /\/(help|stores|gp\/browse|s|hz)\//i
      .test(url)||
     /associates|affiliate-program|application review|affiliate information/i
      .test(title+" "+url);

    return(
     directProduct&&
     !blocked
    );
   });

  const results=
   productResults.map(x=>{

    const cleaned={
     ...x,
     description:
      cleanProductDescription(
       x.description
      )
    };

    return{
     ...cleaned,
     productIntelligence:
      analyzeProduct(cleaned)
    };
   });

  const result={
   found:results.length,

   titles:
    results
     .slice(0,10)
     .map(x=>x.title),

   results,

   searchedAt:
    r.searchedAt,

   query:
    r.query
  };

  await saveProductCandidates(
   result
  );

  await beat(
   "product-scout",
   "online",
   `Saved ${results.length} Amazon product candidates`
  );

  await runLog(
   "product-scout",
   "completed",
   `Saved ${results.length} Amazon product candidates`,
   result,
   start
  );

  return result;

 }catch(e){

  await beat(
   "product-scout",
   "error",
   `Product Scout failed: ${e.message}`
  );

  await runLog(
   "product-scout",
   "failed",
   `Product Scout failed: ${e.message}`,
   {
    error:e.message
   },
   start
  );

  throw e;
 }
}
async function runAutomation(){

 if(automationRunning){
  return;
 }

 automationRunning=true;

 try{

  await beat(
   "agent1",
   "running",
   "Command Center coordinating ecosystem work"
  );

  await work(
   "revenue-intelligence"
  );

  await runProductScout();

  await work(
   "affiliate-intelligence"
  );

  await work(
   "viral-content"
  );

  await work(
   "analytics"
  );

  await work(
   "guardian"
  );

  await work(
   "engineering-guardian"
  );

  await beat(
   "agent1",
   "online",
   "Command Center completed automation cycle"
  );

 }catch(e){

  await beat(
   "agent1",
   "error",
   `Automation cycle failed: ${e.message}`
  );

 }finally{

  automationRunning=false;
 }
}

function startAutomation(){

 setTimeout(
  async()=>{
   await runAutomation();

   setInterval(
    runAutomation,
    COOLDOWN
   );
  },
  FIRST_AUTOMATION_DELAY
 );
}
app.get(
 "/api/health",
 async(req,res)=>{
  try{

   await pool.query(
    "SELECT NOW()"
   );

   res.json({
    status:"healthy",
    database:"reachable",
    revenueStatus:
     "No revenue claimed."
   });

  }catch(e){

   res.status(500).json({
    status:"error",
    error:e.message
   });
  }
 }
);

app.get(
 "/api/agents",
 async(req,res)=>{
  try{

   res.json(
    await agents()
   );

  }catch(e){

   res.status(500).json({
    error:e.message
   });
  }
 }
);

app.get(
 "/api/opportunities",
 async(req,res)=>{
  try{

   const r=
    await pool.query(`
     SELECT *
     FROM opportunities
     ORDER BY discovered_at DESC
    `);

   res.json(r.rows);

  }catch(e){

   res.status(500).json({
    error:e.message
   });
    }
 }
);

app.get(
 "/api/product-scout/products",
 async(req,res)=>{
  try{

   const r=
    await pool.query(`
     SELECT *
     FROM product_candidates
     ORDER BY
      qualification_score DESC NULLS LAST,
      discovered_at DESC
     LIMIT 100
    `);

   res.json(r.rows);

  }catch(e){

   res.status(500).json({
    error:e.message
   });
    }
 }
);
app.get(
 "/api/product-scout/results",
 async(req,res)=>{
  try{

   const r=
    await pool.query(`
     SELECT *
     FROM product_candidates
     ORDER BY discovered_at DESC
     LIMIT 100
    `);

   res.json({
    count:r.rows.length,
    products:r.rows
   });

  }catch(e){

   res.status(500).json({
    error:e.message
   });
    }
 }
);

app.get(
 "/api/amazon/clicks",
 async(req,res)=>{
  try{

   res.json(
    await getAmazonClickStats(
     pool
    )
   );

  }catch(e){

   res.status(500).json({
    error:e.message
   });
    }
 }
);
app.post(
 "/api/agents/run",
 async(req,res)=>{
  try{

   const id=
    req.body?.agentId;

   const result=
    await work(
     id,
     req.body?.details||{}
    );

   res.json({
    success:true,
    agentId:id,
    result
   });

  }catch(e){

   res.status(
    e.code==="not_found"
     ?404
     :500
   ).json({
    success:false,
    error:e.message
   });
    }
 }
);

app.post(
 "/api/product-scout/run",
 async(req,res)=>{
  try{

   const result=
    await runProductScout(
     req.body||{}
    );

   res.json({
    success:true,
    result
   });

  }catch(e){

   res.status(500).json({
    success:false,
    error:e.message
   });
    }
 }
);

app.post(
 "/api/amazon/link",
 async(req,res)=>{
  try{

   const link=
    buildAmazonSpecialLink(
     req.body?.productUrl,
     process.env.AMAZON_ASSOCIATE_TAG
    );

   res.json({
    success:true,
    affiliateLink:link,
    revenueStatus:
     "No revenue claimed."
   });

  }catch(e){

   res.status(400).json({
    success:false,
    error:e.message
   });
    }
 }
);

app.post(
 "/api/amazon/click",
 async(req,res)=>{
  try{

   const result=
    await recordAmazonClick(
     pool,
     {
      productUrl:
       req.body?.productUrl,
      contentId:
       req.body?.contentId||null,
      source:
       req.body?.source||
       "unknown"
     }
    );

   res.json({
    success:true,
    click:result,
    revenueStatus:
     "No revenue claimed."
   });

  }catch(e){

   res.status(400).json({
    success:false,
    error:e.message
   });
    }
 }
);

app.get(
 "/api/research/config",
 (req,res)=>{
  res.json(
   getResearchConfig()
  );
 }
);

app.get(
 "/api/command-center/status",
 async(req,res)=>{
  try{

   res.json({
    automationRunning,
    cooldownMinutes:
     COOLDOWN/60000,
    lastScoutRun,
    agents:
     await agents()
   });

  }catch(e){

   res.status(500).json({
    error:e.message
   });
    }
 }
);

app.post(
 "/api/command-center/cycle",
 async(req,res)=>{
  try{

      const cycle=
    commandCenter.runCycle(
     await agents()
    );

   await runAutomation();

   res.json({
    success:true,
    message:
     "Command Center cycle completed.",
    revenueStatus:
     "No revenue claimed."
   });

  }catch(e){

   res.status(500).json({
    success:false,
    error:e.message
   });
    }
 }
);

app.use(
 (req,res,next)=>{
  if(
   req.path.startsWith("/api/")
  ){
   return res.status(404).json({
    error:"API route not found"
   });
  }

  next();
 }
);

app.get(
 "{*splat}",
 (req,res)=>{
  res.sendFile(
   path.join(
    __dirname,
    "public",
    "index.html"
   )
  );
 }
);

async function start(){

 try{

  await init();

  app.listen(
   PORT,
   ()=>{
    console.log(
     `Ecosystem API listening on port ${PORT}`
    );

    startAutomation();
   }
  );

 }catch(e){

  console.error(
   "Startup failed:",
   e
  );

  process.exit(1);
 }
}

start();

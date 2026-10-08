const https = require("https");

const REPOSITORY =
  process.env.GITHUB_REPOSITORY ||
  "martinrd036-coder/Human-life-ai-ecosystem1";
function githubRequest(path){

 return new Promise(
  (resolve,reject)=>{

   const options={
    hostname:"api.github.com",
    path,
    method:"GET",
    headers:{
     "User-Agent":
      "human-life-ai-expansion-engineer",
     "Accept":
      "application/vnd.github+json"
    }
   };

   const request=
    https.request(
     options,
     response=>{

      let body="";

      response.on(
       "data",
       chunk=>{
        body+=chunk;
       }
      );

      response.on(
       "end",
       ()=>{

        if(
         response.statusCode<200 ||
         response.statusCode>=300
        ){

         reject(
          new Error(
           `GitHub request failed: ${response.statusCode}`
          )
         );

         return;
        }

        try{

         resolve(
          JSON.parse(body)
         );

        }catch(error){

         reject(error);

        }

       }
      );

     }
    );

   request.on(
    "error",
    reject
   );

   request.end();

  }
 );
}
async function githubFile(path){

 const file=
  await githubRequest(
   `/repos/${REPOSITORY}/contents/${path}`
  );

 if(
  !file ||
  file.type!=="file" ||
  !file.content
 ){
  return null;
 }

 return Buffer
  .from(
   file.content,
   "base64"
  )
  .toString("utf8");
}
async function inspectRepository(){

 const repository=
  await githubRequest(
   `/repos/${REPOSITORY}`
  );

 const contents=
  await githubRequest(
   `/repos/${REPOSITORY}/contents`
  );

 const tree=
  await githubRequest(
   `/repos/${REPOSITORY}/git/trees/main?recursive=1`
  );

 const files=
  Array.isArray(tree.tree)
   ? tree.tree
      .filter(
       item=>item.type==="blob"
      )
      .map(
       item=>item.path
      )
   : [];

   const importantFiles=[
  "AGENTS.md",
  "package.json",
  "server.js",
  "exa-research.js",
  "product-intelligence.js",
  "amazon-affiliate.js",
  "command-center.js",
  "higgsfield-provider.js",
  "expansion-engineer.js"
 ];

 const sourceSnapshots={};

 for(
  const filePath
  of importantFiles
 ){

  if(
   !files.includes(filePath)
  ){
   continue;
  }

  try{

   const content=
    await githubFile(
     filePath
    );

   if(
    content
   ){

    sourceSnapshots[filePath]=
     content.slice(
      0,
      12000
     );

   }

  }catch(error){

   sourceSnapshots[filePath]=
    `Unable to read file: ${error.message}`;

  }

 }

 return{
  repository:{
   name:
    repository.name,

   fullName:
    repository.full_name,

   defaultBranch:
    repository.default_branch,

   visibility:
    repository.visibility,

   updatedAt:
    repository.updated_at
  },

  rootContents:
   Array.isArray(contents)
    ? contents.map(
       item=>item.name
      )
    : [],

    files,

  sourceSnapshots,

  fileCount:
   files.length
 };
}

function identifyExpansionAreas(
 inspection
){

 const files=
  inspection.files;

 const areas=[];

 if(
  !files.includes(
   "tests"
  ) &&
  !files.some(
   file=>
    file.startsWith("test/")
  )
 ){

  areas.push({
   area:"testing",
   priority:"high",
   reason:
    "No obvious test directory was detected."
  });

 }

 if(
  !files.some(
   file=>
    file.includes(
     "distribution"
    ) ||
    file.includes(
     "publisher"
    )
  )
 ){

  areas.push({
   area:"distribution",
   priority:"high",
   reason:
    "No obvious publishing/distribution subsystem was detected."
  });

 }

 if(
  !files.some(
   file=>
    file.includes(
     "analytics"
    )
  )
 ){

  areas.push({
   area:"analytics",
   priority:"medium",
   reason:
    "No dedicated analytics implementation was detected by filename."
  });

 }

 if(
  !files.some(
   file=>
    file.includes(
     "engineering"
    )
  )
 ){

  areas.push({
   area:"engineering",
   priority:"high",
   reason:
    "No obvious engineering automation module was detected."
  });

 }

  return areas;
}

function analyzeEcosystemArchitecture(
 inspection
){

 const source=
  inspection.sourceSnapshots || {};

 const has=
  (...terms)=>{

   const text=
    Object.values(source)
     .join("\n")
     .toLowerCase();

   return terms.some(
    term=>
     text.includes(
      term.toLowerCase()
     )
   );

  };

 const capabilities={

  agentCoordination:
   has(
    "commandCenter",
    "assignTask",
    "startTask",
    "completeTask"
   ),

  research:
   has(
    "researchOpportunities",
    "exaSearch",
    "tavilySearch",
    "serperSearch"
   ),

  opportunityDiscovery:
   has(
    "Opportunity Scout",
    "opportunity-scout",
    "scoreOpportunity"
   ),

  productIntelligence:
   has(
    "analyzeProduct",
    "Product Scout",
    "product-intelligence"
   ),

  affiliateTracking:
   has(
    "buildAmazonSpecialLink",
    "recordAmazonClick",
    "getAmazonClickStats"
   ),

  contentProduction:
   has(
    "createVideo",
    "higgsfield",
    "video"
   ),

  distribution:
   has(
    "publish",
    "publisher",
    "distribution"
   ),

  conversionTracking:
   has(
    "conversion",
    "conversions",
    "sale"
   ),

  revenueVerification:
   has(
    "verified revenue",
    "revenueStatus",
    "No revenue claimed"
   ),

  engineeringSafety:
   has(
    "engineering-guardian",
    "runEngineeringGuardian"
   ),

  testing:
   has(
    "npm test",
    "test/",
    "tests"
   ),

  agentCommunication:
   has(
    "agent_runs",
    "assignTask",
    "agent_id"
   )
 };

 const priorities=[
  {
   capability:
    "revenueVerification",
   priority:1,
   goal:
    "Produce measurable verified revenue evidence without fabricating results."
  },
  {
   capability:
    "conversionTracking",
   priority:2,
   goal:
    "Measure clicks, conversions, and funnel movement."
  },
  {
   capability:
    "opportunityDiscovery",
   priority:3,
   goal:
    "Find legitimate opportunities with a credible path to income."
  },
  {
   capability:
    "contentProduction",
   priority:4,
   goal:
    "Turn qualified opportunities into usable content."
  },
  {
   capability:
    "distribution",
   priority:5,
   goal:
    "Move completed content toward real audiences and traffic."
  },
  {
   capability:
    "research",
   priority:6,
   goal:
    "Improve source quality and opportunity intelligence."
  },
  {
   capability:
    "engineeringSafety",
   priority:7,
   goal:
    "Keep autonomous improvements safe, testable, and reviewable."
  },
  {
   capability:
    "testing",
   priority:8,
   goal:
    "Increase confidence before changes reach production."
  }
 ];

 const missingCapabilities=
  priorities
   .filter(
    item=>
     !capabilities[item.capability]
   )
   .map(
    item=>({
     capability:
      item.capability,
     priority:
      item.priority,
     goal:
      item.goal
    })
   );

 return{
  mission:
   "Build legitimate measurable income while preserving system safety and truthful reporting.",

  capabilities,

  missingCapabilities,

  priorities,

  communicationRequirements:[
   "Agents must be able to create and receive structured tasks.",
   "Agents must report status and measurable results.",
   "Agent activity must remain separate from verified revenue.",
   "Agents must share useful results without allowing unsupported revenue claims.",
   "Engineering Guardian must be able to review risky technical changes."
  ],

  incomeRequirements:[
   "Every income experiment must have a measurable funnel.",
   "Opportunity discovery must lead toward an actionable test.",
   "Content production must be distinguished from publication.",
   "Clicks must be distinguished from conversions.",
   "Revenue must only be reported when independently supported by evidence."
  ]
 };
}
function analyzeRevenuePath(
 architecture
){

 const capabilities=
  architecture.capabilities || {};

 const stages=[
  {
   stage:"opportunity",
   capability:"opportunityDiscovery",
   exists:
    !!capabilities.opportunityDiscovery,
   goal:
    "Find legitimate opportunities with a credible path to income."
  },
  {
   stage:"qualification",
   capability:"productIntelligence",
   exists:
    !!capabilities.productIntelligence,
   goal:
    "Qualify offers or products before promotion."
  },
  {
   stage:"monetization",
   capability:"affiliateTracking",
   exists:
    !!capabilities.affiliateTracking,
   goal:
    "Create and track monetizable links."
  },
  {
   stage:"content",
   capability:"contentProduction",
   exists:
    !!capabilities.contentProduction,
   goal:
    "Create useful content that can promote qualified opportunities."
  },
  {
   stage:"distribution",
   capability:"distribution",
   exists:
    !!capabilities.distribution,
   goal:
    "Publish or distribute content to real audiences."
  },
  {
   stage:"click",
   capability:"affiliateTracking",
   exists:
    !!capabilities.affiliateTracking,
   goal:
    "Measure people reaching the monetization link."
  },
  {
   stage:"conversion",
   capability:"conversionTracking",
   exists:
    !!capabilities.conversionTracking,
   goal:
    "Measure completed conversions or sales."
  },
  {
   stage:"verifiedRevenue",
   capability:"revenueVerification",
   exists:
    !!capabilities.revenueVerification,
   goal:
    "Verify actual revenue with evidence."
  }
 ];

 const blockedStages=
  stages
   .filter(
    stage=>
     !stage.exists
   );

 const firstBlocker=
  blockedStages.length
   ? blockedStages[0]
   : null;

 return{
  funnel:
   stages.map(
    stage=>({
     stage:stage.stage,
     status:
      stage.exists
       ? "capability_detected"
       : "capability_missing"
    })
   ),

  firstBlocker,

  priority:
   firstBlocker
    ? "Build or repair the earliest missing revenue stage before adding lower-priority automation."
    : "All major revenue stages have detectable capabilities; prioritize measurement and verified conversions.",

  revenueRule:
   "No revenue is considered real until supported by evidence.",

  recommendedAction:
   firstBlocker
    ? firstBlocker.goal
    : "Run measurable income experiments and improve conversion performance."
 };
}
async function runExpansionEngineer(){
       
 const started=
  Date.now();

 try{

  const inspection=
   await inspectRepository();

  const expansionAreas=
   identifyExpansionAreas(
    inspection
   );
    const architecture=
   analyzeEcosystemArchitecture(
    inspection
   );
   const revenuePath=
 analyzeRevenuePath(
  architecture
 );
  return{
   success:true,

   agentId:
    "expansion-engineer",

   repository:
    inspection.repository,

   inspection:{
    rootContents:
     inspection.rootContents,

    fileCount:
     inspection.fileCount
   },

      expansionAreas,
   architecture,
   revenuePath,

   nextSteps:[
    "Inspect each proposed expansion against existing architecture.",
    "Identify the smallest safe implementation.",
    "Generate tests before implementation where practical.",
    "Create a branch for proposed code.",
    "Run validation before opening a pull request.",
    "Require Engineering Guardian review before production merge."
   ],

   safety:{
    productionWrites:false,
    automaticDeployment:false,
    automaticMerge:false,
    automaticSpending:false,
    revenueClaims:false
   },

   revenueStatus:
    "No revenue claimed.",

   durationMs:
    Date.now()-started
  };

 }catch(error){

  return{
   success:false,

   agentId:
    "expansion-engineer",

   error:
    error.message,

   safety:{
    productionWrites:false,
    automaticDeployment:false,
    automaticMerge:false,
    automaticSpending:false,
    revenueClaims:false
   },

   revenueStatus:
    "No revenue claimed.",

   durationMs:
    Date.now()-started
  };

 }
}

module.exports={
 runExpansionEngineer,
 inspectRepository
};

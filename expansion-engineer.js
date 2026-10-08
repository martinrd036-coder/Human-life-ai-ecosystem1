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
async function githubFile(path){
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

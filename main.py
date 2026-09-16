import os
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title='AI Agent Ecosystem API', version='0.1.0')
origins = [x.strip() for x in os.getenv('CORS_ORIGINS','http://localhost:5173').split(',')]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

class AgentCreate(BaseModel):
    name: str
    purpose: str = ''

agents = []
@app.get('/health')
def health(): return {'status':'ok','service':'api','time':datetime.now(timezone.utc).isoformat()}
@app.get('/api/dashboard')
def dashboard(): return {'agents':agents,'metrics':{'views':0,'clicks':0,'sales':0,'commissions':0},'integrations':{'youtube':'not_connected','tiktok':'not_connected'}}
@app.post('/api/agents')
def create_agent(item: AgentCreate):
    agent={'id':len(agents)+1,'name':item.name,'purpose':item.purpose,'status':'draft'}; agents.append(agent); return agent

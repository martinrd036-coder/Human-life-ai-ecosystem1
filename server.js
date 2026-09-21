const path = require("path");
const express = require("express");
const commandCenter = require("./command-center");

const {
  DEFAULT_RESEARCH_SOURCES,
  getResearchConfig
} = require("./research");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const opportunities = [];

const agentRegistry = [
  {
    id: "agent1",
    name: "Football Intelligence",
    purpose: "Football research and intelligence",
    status: "online",
    lastActivity: "System connected"
  },
  {
    id: "affiliate-intelligence",
    name: "Affiliate Intelligence",
    purpose: "Find and analyze affiliate opportunities",
    status: "not_connected",
    lastActivity: "Not connected yet"
  },
  {
    id: "viral-content",
    name: "Viral Content Agent",
    purpose: "Discover and develop viral content opportunities",
    status: "not_connected",
    lastActivity: "Not connected yet"
  },
  {
    id: "job-hunter",
    name: "Job Hunter Agent",
    purpose: "Find legitimate online income and job opportunities",
    status: "not_connected",
    lastActivity: "Not connected yet"
  },
  {
    id: "analytics",
    name: "Analytics Agent",
    purpose: "Track performance, revenue, and experiments",
    status: "not_connected",
    lastActivity: "Not connected yet"
  },
  {
    id: "opportunity-scout",
    name: "Opportunity Scout",
    purpose: "Discover and prioritize legitimate revenue opportunities",
    status: "building",
    lastActivity: "Agent registry created"
  },
  {
    id: "product-scout",
    name: "Product Scout",
    purpose: "Find products with affiliate and content potential",
    status: "building",
    last

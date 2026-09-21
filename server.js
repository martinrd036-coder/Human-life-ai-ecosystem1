const path = require("path");
const express = require("express");
const commandCenter = require("./command-center");

const {
  DEFAULT_RESEARCH_SOURCES,
  getResearchConfig,
  buildResearchQuery,
  normalizeOpportunity
} = require("./research");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const opportunities = [];

const opportunityCategories = [
  "Remote Jobs",
  "Freelance Work",
  "Affiliate Marketing",
  "TikTok Shop",
  "YouTube",
  "Creator Content",
  "Local Services",
  "Digital Products",
  "Market Research",
  "AI Services",
  "Automation Services",
  "Lead Generation",
  "Research and Data Products",
  "Business Opportunities"
];

const researchSources = [
  "official company career pages",
  "official affiliate programs",
  "official creator programs",
  "official freelance platforms",
  "official government job resources",
  "reputable business opportunity sources"
];

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
    id

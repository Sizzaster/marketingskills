# AGENTS.md

Guidelines for AI agents working in this repository.

## Repository Overview

This repository contains **Agent Skills** for AI agents following the [Agent Skills specification](https://agentskills.io/specification.md). Skills install to `.agents/skills/` (the cross-agent standard). This repo also serves as a **Claude Code plugin marketplace** via `.claude-plugin/marketplace.json`.

- **Name**: Marketing Skills
- **GitHub**: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
- **Creator**: Corey Haines
- **License**: MIT

## Repository Structure

```
marketingskills/
├── .claude-plugin/
│   └── marketplace.json   # Claude Code plugin marketplace manifest
├── skills/                # Agent Skills
│   └── skill-name/
│       └── SKILL.md       # Required skill file
├── tools/
│   ├── clis/              # Zero-dependency Node.js CLI tools (51 tools)
│   ├── integrations/      # API integration guides per tool
│   └── REGISTRY.md        # Tool index with capabilities
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Build / Lint / Test Commands

**Skills** are content-only (no build step). Verify manually:
- YAML frontmatter is valid
- `name` field matches directory name exactly
- `name` is 1-64 chars, lowercase alphanumeric and hyphens only
- `description` is 1-1024 characters

**CLI tools** (`tools/clis/*.js`) are zero-dependency Node.js scripts (Node 18+). Verify with:
```bash
node --check tools/clis/<name>.js   # Syntax check
node tools/clis/<name>.js           # Show usage (no args = help)
node tools/clis/<name>.js <cmd> --dry-run  # Preview request without sending
```

## Agent Skills Specification

Skills follow the [Agent Skills spec](https://agentskills.io/specification.md).

### Required Frontmatter

```yaml
---
name: skill-name
description: What this skill does and when to use it. Include trigger phrases.
---
```

### Frontmatter Field Constraints

| Field         | Required | Constraints                                                      |
|---------------|----------|------------------------------------------------------------------|
| `name`        | Yes      | 1-64 chars, lowercase `a-z`, numbers, hyphens. Must match dir.   |
| `description` | Yes      | 1-1024 chars. Describe what it does and when to use it.          |
| `license`     | No       | License name (default: MIT)                                      |
| `metadata`    | No       | Key-value pairs (author, version, etc.)                          |

### Name Field Rules

- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens (`--`)
- Must match parent directory name exactly

**Valid**: `page-cro`, `email-sequence`, `ab-test-setup`
**Invalid**: `Page-CRO`, `-page`, `page--cro`

### Optional Skill Directories

```
skills/skill-name/
├── SKILL.md        # Required - main instructions (<500 lines)
├── references/     # Optional - detailed docs loaded on demand
├── scripts/        # Optional - executable code
└── assets/         # Optional - templates, data files
```

## Writing Style Guidelines

### Structure

- Keep `SKILL.md` under 500 lines (move details to `references/`)
- Use H2 (`##`) for main sections, H3 (`###`) for subsections
- Use bullet points and numbered lists liberally
- Short paragraphs (2-4 sentences max)

### Tone

- Direct and instructional
- Second person ("You are a conversion rate optimization expert")
- Professional but approachable

### Formatting

- Bold (`**text**`) for key terms
- Code blocks for examples and templates
- Tables for reference data
- No excessive emojis

### Clarity Principles

- Clarity over cleverness
- Specific over vague
- Active voice over passive
- One idea per section

### Description Field Best Practices

The `description` is critical for skill discovery. Include:
1. What the skill does
2. When to use it (trigger phrases)
3. Related skills for scope boundaries

```yaml
description: When the user wants to optimize conversions on any marketing page. Use when the user says "CRO," "conversion rate optimization," "this page isn't converting." For signup flows, see signup-flow-cro.
```

## Claude Code Plugin

This repo also serves as a plugin marketplace. The manifest at `.claude-plugin/marketplace.json` lists all skills for installation via:

```bash
/plugin marketplace add coreyhaines31/marketingskills
/plugin install marketing-skills
```

See [Claude Code plugins documentation](https://code.claude.com/docs/en/plugins.md) for details.

## Git Workflow

### Branch Naming

- New skills: `feature/skill-name`
- Improvements: `fix/skill-name-description`
- Documentation: `docs/description`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add skill-name skill`
- `fix: improve clarity in page-cro`
- `docs: update README`

### Pull Request Checklist

- [ ] `name` matches directory name exactly
- [ ] `name` follows naming rules (lowercase, hyphens, no `--`)
- [ ] `description` is 1-1024 chars with trigger phrases
- [ ] `SKILL.md` is under 500 lines
- [ ] No sensitive data or credentials

## Tool Integrations

This repository includes a tools registry for agent-compatible marketing tools.

- **Tool discovery**: Read `tools/REGISTRY.md` to see available tools and their capabilities
- **Integration details**: See `tools/integrations/{tool}.md` for API endpoints, auth, and common operations
- **MCP-enabled tools**: ga4, stripe, mailchimp, google-ads, resend, zapier

### Registry Structure

```
tools/
├── REGISTRY.md              # Index of all tools with capabilities
└── integrations/            # Detailed integration guides
    ├── ga4.md
    ├── stripe.md
    ├── rewardful.md
    └── ...
```

### When to Use Tools

Skills reference relevant tools for implementation. For example:
- `referral-program` skill → rewardful, tolt, dub-co, mention-me guides
- `analytics-tracking` skill → ga4, mixpanel, segment guides
- `email-sequence` skill → customer-io, mailchimp, resend guides
- `paid-ads` skill → google-ads, meta-ads, linkedin-ads guides

## Checking for Updates

When using any skill from this repository:

1. **Once per session**, on first skill use, check for updates:
   - Fetch `VERSIONS.md` from GitHub: https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/VERSIONS.md
   - Compare versions against local skill files

2. **Only prompt if meaningful**:
   - 2 or more skills have updates, OR
   - Any skill has a major version bump (e.g., 1.x to 2.x)

3. **Non-blocking notification** at end of response:
   ```
   ---
   Skills update available: X marketing skills have updates.
   Say "update skills" to update automatically, or run `git pull` in your marketingskills folder.
   ```

4. **If user says "update skills"**:
   - Run `git pull` in the marketingskills directory
   - Confirm what was updated

## Heavenly Heat Saunas — Agent Fleet

This repository powers the marketing skills for **Heavenly Heat Saunas**. The company runs a fleet of 13 AI agents managed via a Command Center dashboard. When working in this repo, be aware of the existing agents and their schedules — do NOT create new agents without checking this list first.

### Departments and Agents

Each department has one primary agent. Some departments share agents for social channels.

| # | Department | Agent | Role | Schedule |
|---|-----------|-------|------|----------|
| 1 | **CEO** | Cecilia CEO | Weekly Strategic View | Mondays 07:00 CT |
| 2 | **Finance** | Frank Finance | Daily Financial Refresh | Daily 04:00 CT |
| 3 | **Sales** | Sally Sales | Daily Revenue Intel | Daily 06:08 CT |
| 4 | **Inventory** | Ivy Inventory | Weekly Inventory Refresh | Fridays 06:00 CT |
| 5 | **Returns** | Rita Returns | Weekly Returns Tracker | Fridays 06:00 CT |
| 6 | **Social** | Ingrid Instagram | IG Intelligence | Daily 05:15 CT |
| 6 | **Social** | Tim Tweets | X/Twitter Radar | Daily 05:20 CT |
| 6 | **Social** | Tessa | Tweet Scanner / Email Reports | Active |
| 7 | **Partnerships** | Preston Partnerships | Weekly Sales Attribution | Fridays 15:00 CT |
| 8 | **Operations** | Ruby Refresh | Weekly Repo Updater | Fridays 15:00 CT |
| 9 | **Communications** | Diana Drafts | Email Reply Co-Pilot | Twice Daily |
| 10 | **Brand Voice** | Willa Writer | Writing Style Engine | Weekly |
| 11 | **Archives** | Aria Archive | Communication Vault | Nightly |
| 12 | **Meta/Coordination** | Dahlia Dashboard | Meta-Agent Coordinator | Daily 06:00 & 18:00 CT |

**Departments documented: 12.** Target: 10–15. New departments to be added as agents are created (e.g., Customer Service, Marketing/Paid, Product, HR).

### Fleet Size

Total fleet: **14 agents** (all documented above). 5 dashboard, 5 active, 4 planned (pending deployment).

### What Each Agent Monitors

| Agent | Data Sources |
|-------|-------------|
| Cecilia CEO | MAIT, Shopify, FT, EOS Scorecard, all department dashboards |
| Frank Finance | MAIT, FT, FBT, Shopify API, cash flow |
| Sally Sales | Shopify data, orders, products, daily trends |
| Ivy Inventory | Shopify fulfillment, PO pipeline, QC inspection data |
| Rita Returns | Shopify refunds, return reasons, SKU defect patterns |
| Ingrid Instagram | Instagram posts, brand mentions, engagement opportunities |
| Tim Tweets | X conversations, wellness trends, viral threads, influencer signals |
| Tessa | Tweet scanning (142 tweets/day), sends email reports |
| Preston Partnerships | Affiliate codes, paid media codes, organic attribution |
| Ruby Refresh | 31 tracked Google documents, department CLAUDE.md files |
| Diana Drafts | Gmail inbox, sender priority, thread context |
| Willa Writer | Gmail sent folder, style drift detection |
| Aria Archive | Gmail sent folder, pattern indexing |
| Dahlia Dashboard | All agent logs, error rates, uptime |

### Agent-to-Skill Mapping

When a user references an agent by name, activate the corresponding skill:

| Agent | Primary Skill | Notes |
|-------|---------------|-------|
| Frank Finance | `automate-mait-reporting` | Already pulls MAIT data daily at 04:00 CT. Also uses `revops` |
| Sally Sales | `automate-mait-reporting` | Revenue intel from Shopify + ad spend. Also uses Shopify CLI |
| Cecilia CEO | `automate-mait-reporting` | Consumes MAIT weekly for strategic dashboard |
| Preston Partnerships | `automate-mait-reporting`, `referral-program` | Attribution by discount code type |
| Ingrid Instagram | `social-content` | Instagram monitoring |
| Tim Tweets | `social-content` | Twitter/X monitoring |
| Tessa | `social-content` | Tweet scanning and email reports |
| Diana Drafts | `email-sequence` | Drafts replies in Warren's voice. Pending deployment |
| Willa Writer | `email-sequence` | Analyzes tone, vocabulary, formatting. Pending deployment |
| Aria Archive | `email-sequence` | Builds searchable knowledge base of sent emails. Pending deployment |
| Dahlia Dashboard | — | Coordinates all agents, pulls status twice daily. Pending deployment |

### Important

- **Do NOT create new agent personas** without checking this fleet list
- **Frank Finance already runs MAIT daily at 04:00 CT** — do not duplicate this
- **Sally Sales already does daily revenue intel** — do not duplicate this
- Agent dashboard location: `agent-dashboard.html` on the user's Google Drive

## Self-Updating Instructions (Recursive Learning)

**Every Claude Code session that modifies this repo MUST update documentation before finishing.** This is how the repo learns from each session.

### When to Update (Triggers)

After completing any of these actions, update the relevant docs **in the same session, before your final commit**:

1. **New agent created** → Add to the Departments and Agents table above, update Fleet Size, add to Agent-to-Skill Mapping
2. **New department added** → Add row to Departments table, increment department count
3. **New skill created** → Update `README.md` skill list, add to Agent-to-Skill Mapping if applicable
4. **Agent schedule changed** → Update the Departments and Agents table
5. **New tool integration added** → Update `tools/REGISTRY.md` and the When to Use Tools section
6. **Skill deleted or renamed** → Update all references in CLAUDE.md, README.md, and any skill cross-references
7. **Fleet size changed** → Update Fleet Size count
8. **New data source connected** → Update the What Each Agent Monitors table

### What to Update (Checklist)

For **every structural change**, check these files:

| Change Type | Files to Update |
|------------|-----------------|
| New agent | `CLAUDE.md` (Departments table, Fleet Size, Agent-to-Skill Mapping) |
| New department | `CLAUDE.md` (Departments table, department count) |
| New skill | `README.md` (skill list), `CLAUDE.md` (Agent-to-Skill Mapping if applicable) |
| New tool | `tools/REGISTRY.md`, `CLAUDE.md` (When to Use Tools) |
| Any rename | All files that reference the old name |

### How to Update (Process)

1. Make your primary changes (the new skill, agent, etc.)
2. Before your final commit, re-read `CLAUDE.md` and check every section that could be affected
3. Make all documentation updates
4. Commit everything together with a message that includes what was updated

### What NOT to Do

- Do NOT create agents that duplicate existing agent responsibilities (check the table first)
- Do NOT add departments without an agent assignment
- Do NOT skip documentation updates — the next session depends on this being accurate
- Do NOT guess agent details — if you don't know, ask the user

## Skill Categories

See `README.md` for the current list of skills organized by category. When adding new skills, follow the naming patterns of existing skills in that category.

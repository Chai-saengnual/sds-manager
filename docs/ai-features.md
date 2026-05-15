# AI Features Documentation

## Overview

SDS Manager includes AI-powered features to help you:
- Extract information from uploaded SDS PDFs
- Generate summaries
- Detect outdated records
- Identify duplicates
- Generate compliance reports

## Setup

### 1. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new secret key
5. Add to environment variable: `OPENAI_API_KEY=sk-...`

### 2. Enable AI Features

In the admin panel, enable:
- Auto-analyze on upload
- AI update recommendations
- Duplicate detection

## Features

### PDF Analysis

When you upload an SDS PDF, you can run AI analysis to:

**Extract:**
- Chemical names and CAS numbers
- GHS hazard classifications
- PPE (Personal Protective Equipment) recommendations
- Storage and handling requirements
- First aid information
- Emergency procedures

**Generate:**
- 2-3 sentence summary of the chemical
- Recommendations for use
- Important warnings

### Smart Update Detection

The AI Update Agent automatically:

1. **Scans all SDS records** daily
2. **Identifies outdated records** (revision date > 1 year)
3. **Flags expiring follow-up dates** (30/60/90 days before)
4. **Detects missing PDFs**
5. **Suggests hazard categories** based on content

### Duplicate Detection

AI compares chemical names, summaries, and hazards to:
- Find potential duplicates
- Suggest merging records
- Prevent redundant entries

### Compliance Reports

Generate HTML/PDF reports with:
- Overview of compliance status
- List of outdated records
- Recommendations for action
- Export for audits

### AI Chat Assistant

Ask questions about any SDS:
- "What PPE is required for this chemical?"
- "How should this chemical be stored?"
- "What are the first aid measures?"

## Usage

### Running Manual Analysis

1. Go to SDS record detail page
2. Click "Analyze with AI" button
3. Wait for analysis to complete
4. View extracted data and summary

### AI Update Agent

1. Go to Admin > AI Settings
2. Configure scan frequency
3. View recommendations
4. Take action on suggestions

## Pricing

OpenAI pricing is based on token usage:
- GPT-4o-mini: ~$0.005 per 1K tokens
- GPT-4o: ~$0.03 per 1K tokens

A typical SDS analysis uses ~3,000-5,000 tokens.

**Estimated cost per record:** $0.015 - $0.15

## Best Practices

1. **Start with summaries** - They're faster and cheaper
2. **Enable auto-analysis** for new uploads
3. **Review AI suggestions** before applying
4. **Set budget limits** in OpenAI dashboard

## Troubleshooting

### Analysis Fails

- Check OpenAI API key is valid
- Ensure sufficient API credits
- Check network connectivity

### Poor Results

- Upload higher quality PDFs
- Ensure text is readable (not scanned)
- Try re-analyzing with more context

### Rate Limits

- Implement caching for repeated analyses
- Use batch processing for bulk operations
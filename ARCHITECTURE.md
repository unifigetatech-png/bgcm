# Project Architecture & Boundaries

## Project Overview
A modular utility suite consisting of three isolated tools.

## Core Modules
1. **HTML Builder (`src/html_builder/`):** Responsible for template generation and HTML assembly.
2. **Media Naming (`src/media_namer/`):** Responsible for file renaming conventions, metadata handling, and media organization.
3. **SEO Analyzer (`src/seo_analyzer/`):** Responsible for parsing HTML/metadata to analyze SEO performance.

## Architectural Boundaries
- Modules must remain strictly isolated. 
- Shared utilities (like logging or file I/O helpers) live in `src/shared/`.
- No module may directly depend on or import from another module.
## Deployment & Launch State
- **Current Status**: Pre-launch development phase.
- **Indexing Status**: STRICT NO-INDEX REQUIRED.
- **Production URL**: https://burleighmotel.com.au

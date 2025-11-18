# GitHub Spec Kit - Manual Installation

This directory contains the GitHub Spec Kit templates and utilities for spec-driven development.

## Installation Method

Due to compatibility issues with the `specify init` command on Windows/MINGW64, these files were manually installed by cloning the [github/spec-kit](https://github.com/github/spec-kit) repository and copying the necessary files.

## Directory Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project principles and guidelines
├── scripts/
│   └── bash/                    # Bash utility scripts
│       ├── check-prerequisites.sh
│       ├── common.sh
│       ├── create-new-feature.sh
│       ├── setup-plan.sh
│       └── update-agent-context.sh
├── specs/                       # Directory for your feature specs
└── templates/                   # Templates for creating specs, plans, and tasks
    ├── agent-file-template.md
    ├── checklist-template.md
    ├── plan-template.md
    ├── spec-template.md
    └── tasks-template.md
```

## Claude Code Commands

The following slash commands are available in Claude Code (located in `.claude/commands/`):

- `/speckit.specify` - Create a new feature specification
- `/speckit.clarify` - Clarify requirements and ask questions
- `/speckit.plan` - Generate an implementation plan
- `/speckit.tasks` - Break down into actionable tasks
- `/speckit.implement` - Implement the planned tasks
- `/speckit.analyze` - Analyze existing code
- `/speckit.checklist` - Generate implementation checklist
- `/speckit.constitution` - View project constitution
- `/speckit.taskstoissues` - Convert tasks to GitHub issues

## Getting Started

1. Review the constitution in `.specify/memory/constitution.md` and customize it for your project
2. Use `/speckit.specify` to create your first feature specification
3. Follow the spec-driven development workflow: Specify → Clarify → Plan → Tasks → Implement

## Resources

- [GitHub Spec Kit Documentation](https://github.com/github/spec-kit)
- [Spec-Driven Development Guide](https://github.com/github/spec-kit/blob/main/spec-driven.md)

## Installation Date

Installed: 2025-11-18
Source: github/spec-kit repository (HEAD)

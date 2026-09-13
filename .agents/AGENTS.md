# Custom Rules for Science Platform Project

## Experiment Import Rule from External Branches
When the user asks to bring or import an experiment from a git branch (e.g., "هات تجربة كذا من برانش كذا"):
1. Never perform a direct `git merge` of the whole branch into `main` because target branches may contain old code or lack new subscription/freeze systems.
2. Always perform a selective `git checkout <branch> -- <files>` to cherry-pick ONLY the experiment's specific files (`experiments/*.php`, `css/*.css`, `js/experiments/*`).
3. Always update `my-experiments.php` visuals, `science_platform.sql` seeds, and `project_architecture.md`.

## UI/UX Pro Max Protocol (`ui-ux-pro-max-cli`)
1. **Tooling & Setup**:
   - The project uses `ui-ux-pro-max-cli` (initialized via `uipro init --ai antigravity`).
   - The design intelligence skills and data reside in `.agents/skills/ui-ux-pro-max/`.
2. **Mandatory UI Workflow (Every New Component & Screen)**:
   - For any new screen, component, or visual update, query the design system:
     `python .agents/skills/ui-ux-pro-max/scripts/search.py "<topic>" [--design-system | --domain <domain> | --stack <stack>]`
   - **Interrogation & Prototyping**: Ask the user targeted, numbered design & interaction questions (typography, color palettes, micro-interactions, responsive constraints) before writing the final UI code.
3. **Strict Design & UX Standards**:
   - Zero raw emojis as icons (strictly modern SVGs like FontAwesome / Lucide or Lottie).
   - Strict 4px spacing scale, semantic color CSS variables, and fluid transitions (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - High contrast (>= 4.5:1), keyboard navigation accessibility, and Doherty threshold (<400ms feedback).


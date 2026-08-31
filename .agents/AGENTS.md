# Custom Rules for Science Platform Project

## Experiment Import Rule from External Branches
When the user asks to bring or import an experiment from a git branch (e.g., "هات تجربة كذا من برانش كذا"):
1. Never perform a direct `git merge` of the whole branch into `main` because target branches may contain old code or lack new subscription/freeze systems.
2. Always perform a selective `git checkout <branch> -- <files>` to cherry-pick ONLY the experiment's specific files (`experiments/*.php`, `css/*.css`, `js/experiments/*`).
3. Always update `my-experiments.php` visuals, `science_platform.sql` seeds, and `project_architecture.md`.

---
name: import-experiment
description: Guidelines and procedure for cherry-picking a virtual science experiment from a specified git branch into main platform without overwriting core subscription system or existing features.
---

# Standard Operating Procedure: Cherry-Picking & Integrating Experiments from Branches

When the user asks to import or bring an experiment from a specific git branch (e.g., "هات تجربة كذا من برانش كذا"):

## Step 1: Branch & Commit Inspection
1. Fetch all remotes: `git fetch --all`.
2. Inspect commits on the target branch: `git log main..<branch_name> --oneline` or `git show <commit_hash>`.
3. Identify all files associated with the experiment (PHP views, CSS, modular JS engines, DB scripts).

## Step 2: Selective Checkout (Cherry-pick files only)
Do NOT merge the whole branch directly, as target branches might be based on older versions without subscription/freeze controls.
Run:
`git checkout <branch_name> -- css/<exp_name>.css experiments/<exp_name>.php js/experiments/<exp_name>/ scratch/register_<exp_name>.php`

## Step 3: UI Card & Category Integration (`my-experiments.php`)
1. Open `my-experiments.php`.
2. Update `getExpVisuals($code_name, $title)` function to include visual styling (icon, color, background gradient) for the new experiment.
3. Ensure the experiment requires active subscription (`$is_subscribed`) like all core platform experiments.

## Step 4: Database Seed Update (`science_platform.sql`)
1. Open `science_platform.sql`.
2. Add the `INSERT INTO experiments` tuple for the new experiment (`id`, `code_name`, `title`, `page_url`, `is_active`).

## Step 5: Update Architecture Context (`project_architecture.md`)
1. Update `project_architecture.md` file tree and file responsibilities with the new experiment's PHP, CSS, and modular JS files.

## Step 6: Verification
1. Run `git status` to ensure all experiment files are added and staged cleanly.
2. Verify PHP/JS syntax.

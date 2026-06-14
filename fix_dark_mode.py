import os
import re

directories = [r"d:\arkon_azure\src\components", r"d:\arkon_azure\src\pages"]

patterns = [
    (r"bg-white shadow-sm border border-border border border-border", r"bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800"),
    (r"bg-white shadow-sm border border-border hover:bg-white shadow-sm border border-border border border-border", r"bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"),
    (r"bg-white shadow-sm border border-border hover:bg-white shadow-sm border border-border", r"bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"),
    (r"bg-white shadow-sm border border-border", r"bg-[var(--bg-surface)] shadow-sm border border-border dark:border-slate-800"),
    (r"border-border border border-border", r"border-border dark:border-slate-800"),
    (r"(?<!-)bg-white(?!\/)", r"bg-[var(--bg-surface)]"),
    (r"(?<!-)text-gray-800(?!\/)", r"text-foreground"),
    (r"(?<!-)text-gray-900(?!\/)", r"text-foreground"),
    (r"(?<!-)text-gray-700(?!\/)", r"text-foreground"),
    (r"(?<!-)text-gray-600(?!\/)", r"text-secondary"),
    (r"(?<!-)text-gray-500(?!\/)", r"text-secondary"),
    (r"(?<!-)bg-gray-50(?!\/)", r"bg-slate-50 dark:bg-slate-900"),
    (r"(?<!-)bg-gray-100(?!\/)", r"bg-slate-100 dark:bg-slate-800"),
    (r"(?<!-)bg-gray-200(?!\/)", r"bg-slate-200 dark:bg-slate-700"),
    (r"(?<!-)border-gray-100(?!\/)", r"border-border dark:border-slate-800"),
    (r"(?<!-)border-gray-200(?!\/)", r"border-border dark:border-slate-800"),
    (r"(?<!-)border-gray-300(?!\/)", r"border-border dark:border-slate-700"),
]

for directory in directories:
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".jsx"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content
                for pattern, replacement in patterns:
                    new_content = re.sub(pattern, replacement, new_content)
                
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Updated: {file}")

print("Done.")

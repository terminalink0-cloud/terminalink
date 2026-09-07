# create-structure.ps1

$folders = @(
    "src/api",
    "src/auth",
    "src/components",
    "src/hooks",
    "src/layouts",
    "src/pages",
    "src/routes",
    "src/types",
    "src/utils"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Write-Host ""
Write-Host "✅ Frontend folder structure created successfully!" -ForegroundColor Green
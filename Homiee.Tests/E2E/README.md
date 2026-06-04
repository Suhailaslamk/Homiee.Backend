# Homiee End-to-End Tests

These tests use xUnit plus Microsoft Playwright and live in the `Homiee.Tests/E2E` folder.

## Run

Start the Homiee backend and frontend first, then set the frontend URL:

```powershell
$env:HOMIEE_E2E_BASE_URL = "http://localhost:5173"
dotnet test Homiee.Tests.csproj --filter "FullyQualifiedName~E2E"
```

The tests are no-op unless `HOMIEE_E2E_BASE_URL` is set. To fail when the URL is missing:

```powershell
$env:HOMIEE_E2E_REQUIRE = "true"
```

## First-Time Browser Install

After restoring/building the test project, install Playwright browsers:

```powershell
pwsh .\bin\Debug\net8.0\playwright.ps1 install
```

Optional settings:

```powershell
$env:HOMIEE_E2E_BROWSER = "chromium" # chromium, firefox, or webkit
$env:HOMIEE_E2E_HEADLESS = "false"   # show browser while debugging
```

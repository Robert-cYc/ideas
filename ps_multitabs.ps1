# Open Windows Terminal with multiple colored tabs

# Helper: encode a PowerShell scriptblock for -EncodedCommand (avoids quoting issues in batch files)
function ConvertTo-EncodedCommand([string]$Command) {
    [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
}

# Live GPU monitor loop — encoded to sidestep batch-file quote escaping
$gpuLoop = ConvertTo-EncodedCommand 'while($true){ Clear-Host; nvidia-smi.exe; Start-Sleep 5 }'

# Define tab settings: Title, Profile, Color (HEX), optional Command
$tabs = @(
    @{ Title = "btop4win";     Profile = "Command Prompt";     Color = "#8B4513"; Command = "btop4win.exe" },                                   # Brown
    @{ Title = "GPU Monitor";  Profile = "Windows PowerShell"; Color = "#1E90FF"; Command = "powershell.exe -NoExit -EncodedCommand $gpuLoop" }, # Blue  (live refresh every 1s)
    @{ Title = "PowerShell 2"; Profile = "Windows PowerShell"; Color = "#800080" },                                                              # Purple
    @{ Title = "PowerShell 3"; Profile = "Windows PowerShell"; Color = "#228B22" },                                                              # Green
    @{ Title = "PowerShell 4"; Profile = "Windows PowerShell"; Color = "#FF8C00" },                                                              # Orange
    @{ Title = "PowerShell 5"; Profile = "Windows PowerShell"; Color = "#DC143C" },                                                              # Red
    @{ Title = "PowerShell 6"; Profile = "Windows PowerShell"; Color = "#008080" }                                                               # Teal
)

# Validate that each tab's executable exists before launching
foreach ($tab in $tabs) {
    if ($tab.Command) {
        $exe = ($tab.Command -split ' ')[0]
        if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) {
            Write-Warning "Executable not found for tab '$($tab.Title)': $exe"
        }
    }
}

# Build the wt.exe argument string
$arguments = @()
foreach ($i in 0..($tabs.Count - 1)) {
    $tab = $tabs[$i]
    $cmd = ""

    # Use 'new-tab' for subsequent tabs after the first window opens
    if ($i -gt 0) {
        $cmd += "new-tab "
    }

    $cmd += "--title `"$($tab.Title)`" --tabColor `"$($tab.Color)`" -p `"$($tab.Profile)`""
    if ($tab.Command) {
        $cmd += " $($tab.Command)"
    }
    $arguments += $cmd
}

# Join sub-commands with a semicolon
$wtArgs = $arguments -join " ; "

# Launch Windows Terminal via batch file (avoids PowerShell argument quoting issues)
$batchFile = [System.IO.Path]::GetTempFileName() + ".bat"
try {
    [System.IO.File]::WriteAllText($batchFile, "wt $wtArgs")
    Start-Process cmd -ArgumentList "/c $batchFile" -Wait
}
finally {
    # Always clean up temp file, even if an error occurs
    Remove-Item $batchFile -Force -ErrorAction SilentlyContinue
}
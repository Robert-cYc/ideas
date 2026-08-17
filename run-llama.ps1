<#
.SYNOPSIS
  選擇資料夾內的 LLM 模型並啟動 llama-server
#>
#-ngl 99: 將所有模型層 (Layers) 全部丟進 RTX 4060 運算。
#-fa: 開啟 Flash Attention，大幅降低長對話時的 VRAM 佔用。
#-c 8192: 設定 8k Context Window；若發現 VRAM 溢出，可微調降至 4096。
#--jinja: 開啟 Jinja2 範本支援，讓伺服器能渲染 Jinja2 對話範本。


param(
    [string]$Port = 8080,
    [string]$Ngl  = 99
)

# 確保 llama-server 可以找到
$server = Get-Command llama-server -ErrorAction SilentlyContinue
if (-not $server) {
    Write-Host "找不到 llama-server，請確認它已加入 PATH。" -ForegroundColor Red
    Pause
    exit 1
}

# --- 找 .gguf 檔案 ---
$modelDir = if (Test-Path ".\model") { ".\model" } else { "." }
$models = Get-ChildItem -Path $modelDir -Filter "*.gguf" -File -ErrorAction SilentlyContinue |
          Sort-Object Name

if ($models.Count -eq 0) {
    Write-Host "沒找到任何 .gguf 模型檔案（搜尋路徑: $modelDir）" -ForegroundColor Yellow
    Pause
    exit 1
}

# --- 顯示選單 ---
Write-Host ""
Write-Host "可用的 LLM 模型：" -ForegroundColor Cyan
for ($i = 0; $i -lt $models.Count; $i++) {
    $size = [math]::Round($models[$i].Length / 1GB, 2)
    Write-Host "  [$($i + 1)] $($models[$i].Name)  ($size GB)" -ForegroundColor Gray
    Write-Host "      $($models[$i].FullName)" -ForegroundColor DarkGray
}
Write-Host ""

# --- 讀取上次選擇 ---
$lastChoiceFile = "$env:LOCALAPPDATA\run-llama-last-choice.txt"
$lastChoice = Get-Content $lastChoiceFile -ErrorAction SilentlyContinue
if ($lastChoice -and [int]$lastChoice -ge 1 -and [int]$lastChoice -le $models.Count) {
    Write-Host "上次選擇: [$($lastChoice)] $($models[[int]$lastChoice - 1].Name)" -ForegroundColor DarkCyan
}

# --- 讓使用者選擇 ---
do {
    $choice = Read-Host "選擇要執行的模型 (序號) [1-$($models.Count)]"
} while (-not ($choice -as [int]) -or [int]$choice -lt 1 -or [int]$choice -gt $models.Count)

$selected = $models[[int]$choice - 1].FullName

# --- 記錄上次選擇 ---
[int]$choice | Out-File $lastChoiceFile -Encoding ASCII

# --- 檢查 Port 是否被佔用 ---
try {
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop -WarningAction SilentlyContinue
    if ($portInUse) {
        Write-Host "Port $Port 已被佔用！" -ForegroundColor Red
        Write-Host "占用程序: $(($portInUse.OwningProcess | ForEach-Object { (Get-Process -Id $_ -ErrorAction SilentlyContinue).ProcessName }) -join ', ')" -ForegroundColor Yellow
        $Port = Read-Host "請輸入其他 Port (直接按 Enter 取消)"
        if ([string]::IsNullOrWhiteSpace($Port)) {
            Write-Host "已取消。" -ForegroundColor Yellow
            Pause
            exit 0
        }
    }
} catch {
    # Get-NetTCPConnection 可能在某些環境失敗 - 忽略即可
}

# --- GPU 狀態檢查 ---
Write-Host ""
Write-Host "GPU 狀態：" -ForegroundColor Cyan
if (-not (Get-Command nvidia-smi -ErrorAction SilentlyContinue)) {
    Write-Host "找不到 nvidia-smi (非 NVIDIA GPU 或驅動未安裝)" -ForegroundColor Yellow
} else {
    $query = "name,memory.used,memory.total,utilization.gpu,utilization.memory,temperature.gpu,power.draw,power.limit,fan.speed,clocks.sm,clocks.mem"
    # 優先嘗試 nokey,nounits 格式 — 輸出乾淨無標頭
    $gpuInfo = & nvidia-smi --query-gpu=$query --format=csv,nokey,nounits 2>$null
    $smiOk = ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrEmpty($gpuInfo) -and $gpuInfo -notmatch "Format modifier|not a valid field|Failed to")
    if (-not $smiOk) {
        # 舊版 nvidia-smi 不支援 nokey,nounits，退回帶標頭格式
        $gpuInfo = & nvidia-smi --query-gpu=$query --format=csv 2>$null
        $smiOk = ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrEmpty($gpuInfo) -and $gpuInfo -notmatch "Format modifier|not a valid field|Failed to")
    }
    if (-not $smiOk) {
        # 再退回基礎表格
        $gpuInfo = & nvidia-smi 2>$null
        $smiOk = ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrEmpty($gpuInfo))
    }
    if ($smiOk -and $gpuInfo) {
        # 美化輸出：將逗號分隔的數值改為直觀顯示
        # 處理不同格式的可能性：
        #   nokey,nounits: "RTX 4060, 438, 8188, 45, 30, 65, 120, 175, 40, 2100, 6500"
        #   csv (with header): 帶欄位名稱 + 單位 (MiB, %, C, W)
        $gpuInfo -split "`n" | ForEach-Object {
            $line = $_.Trim()
            if ([string]::IsNullOrEmpty($line)) { return }

            # 跳過包含標頭欄位名稱的行（csv with header）
            if ($line -match "^(name|memory\.|\[)") { return }

            $parts = ($line -split ",\s*").Trim()
            if ($parts.Count -ge 11) {
                $name, $used, $total, $utilGpu, $utilMem, $temp, $powerDraw, $powerLimit, $fanSpeed, $smClock, $memClock = $parts[0..10]

                # 移除單位文字 (e.g. "438 MiB" → 438, "45 %" → 45, "3.12 W" → 3.12, "N/A" → 0)
                $def = { param($s) $n = [regex]::Match($s, '\d+(?:\.\d+)?'); if ($n.Success) { [double]$n.Value } else { 0 } }
                $usedVal   = & $def $used
                $totalVal  = & $def $total
                $gpuUtil   = & $def $utilGpu
                $memUtil   = & $def $utilMem
                $gpuTemp   = & $def $temp
                $pDraw     = & $def $powerDraw
                $pLimit    = & $def $powerLimit
                $fan       = & $def $fanSpeed
                $smClk     = & $def $smClock
                $memClk    = & $def $memClock

                $usedGB  = [math]::Round($usedVal / 1024, 2)
                $totalGB = [math]::Round($totalVal / 1024, 2)

                Write-Host "  GPU: $name" -ForegroundColor DarkCyan
                Write-Host "  VRAM: $usedGB GB / $totalGB GB  (GPU 使用率 $gpuUtil%, 記憶體使用率 $memUtil%)"
                Write-Host "  溫度: ${gpuTemp}°C  |  風扇: $fan%  |  功耗: ${pDraw}W / ${pLimit}W"
                Write-Host "  時脈: SM $smClk MHz, 記憶體 $memClk MHz"
            } else {
                Write-Host "  $line" -ForegroundColor DarkCyan
            }
        }
    } else {
        Write-Host "nvidia-smi 執行失敗，請檢查驅動狀態。" -ForegroundColor Yellow
    }
}

# --- 啟動前確認 ---
Write-Host ""
Write-Host "即將啟動：" -ForegroundColor Green
Write-Host "  llama-server -m $selected --port $Port -ngl $Ngl -c 8192 --jinja -fa on"
Write-Host ""
$confirm = Read-Host "按 Enter 繼續，輸入 n 取消"
if ($confirm -eq 'n') {
    Write-Host "已取消。" -ForegroundColor Yellow
    Pause
    exit 0
}

# --- 啟動 ---
Write-Host ""
Write-Host "正在啟動 llama-server ..." -ForegroundColor Green
& llama-server -m $selected --port $Port -ngl $Ngl -c 8192 --jinja -fa on
$exitCode = $LASTEXITCODE
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "llama-server 已停止。" -ForegroundColor Yellow
} else {
    Write-Host "llama-server 結束 (Exit code: $exitCode) - 請往上檢視錯誤訊息。" -ForegroundColor Red
}
Pause
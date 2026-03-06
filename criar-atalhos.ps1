# Cria atalhos com icones na Area de Trabalho
# Executar uma vez: clique direito -> Executar com PowerShell

$raiz   = "C:\Users\hoffm\projetos\prismatic-labs-2026"
$shell  = New-Object -ComObject WScript.Shell
$desk   = [System.Environment]::GetFolderPath('Desktop')

# --- Dashboard ---
$s1 = $shell.CreateShortcut("$desk\Dashboard - Vendedor AI.lnk")
$s1.TargetPath   = "$raiz\dashboard.bat"
$s1.WorkingDirectory = $raiz
$s1.IconLocation = "shell32.dll,14"   # monitor
$s1.Description  = "Abre o Vendedor AI Dashboard no navegador"
$s1.WindowStyle  = 7  # minimizado (nao aparece cmd)
$s1.Save()

# --- Vendedor CLI ---
$s2 = $shell.CreateShortcut("$desk\Vendedor AI.lnk")
$s2.TargetPath   = "$raiz\vendedor.bat"
$s2.WorkingDirectory = $raiz
$s2.IconLocation = "shell32.dll,137"  # grupo de pessoas
$s2.Description  = "Terminal do Vendedor AI (analyze, scout, followup...)"
$s2.WindowStyle  = 1  # normal
$s2.Save()

Write-Host ""
Write-Host "  Atalhos criados na Area de Trabalho:" -ForegroundColor Green
Write-Host "  - Dashboard - Vendedor AI" -ForegroundColor Cyan
Write-Host "  - Vendedor AI" -ForegroundColor Cyan
Write-Host ""
Read-Host "  Pressione Enter para fechar"

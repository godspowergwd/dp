$p = 'c:\Users\user\Downloads\PD\apps\web\public\js\pages-admin.js'
$c = Get-Content $p -Raw

# Admin page wording polish
$c = $c.Replace('><i class="ri-refresh-line"></i> Sync All Providers</button>', '><i class="ri-refresh-line"></i> Refresh Catalogue</button>')
$c = $c.Replace("document.getElementById('admin-sync-result').textContent = 'Sync complete';", "document.getElementById('admin-sync-result').textContent = 'Catalogue updated';")
$c = $c.Replace("utils.toast('success', 'Sync complete', 'Product catalogue updated')", "utils.toast('success', 'Catalogue updated', 'The latest products are now available.')")
$c = $c.Replace("utils.toast('error', 'Sync failed', err.message)", "utils.toast('error', 'Unable to update', err.message)")

Set-Content -Path $p -Value $c -Encoding UTF8
Write-Output 'done'
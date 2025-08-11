$solutionDir = (Split-Path -parent (Split-Path -parent $PSScriptRoot))
$vhdir =  Split-Path -parent $solutionDir;
. "$vhdir/VpnHood/Pub/Core/Common.ps1"
$solutionDir = (Split-Path -parent (Split-Path -parent $PSScriptRoot))

Write-Host "";
Write-Host "*** Publishing VpnHood CONNECT of GooglePlay ..." -BackgroundColor Blue -ForegroundColor White;


$projectDir = $PSScriptRoot


#find the apk in current folder
$apkFileData = Get-ChildItem -Path $projectDir -Filter *.apk | Select-Object -First 1;
if ($null -eq $apkFileData )
{
	Write-Host "No apk file found in $projectDir" -ForegroundColor Red;
	exit;
}
$apkFile = $apkFileData.FullName;
$apkVersionCode = (Get-Item $apkFile).Basename;
$versionParam = "$($version.ToString(2)).$apkVersionCode";
$versionTag = "v$($version.ToString(2)).$apkVersionCode";

# prepare module folders
$moduleDir = "$projectDir/apk/$apkVersionCode";
$moduleDirLatest = "$projectDir/apk/latest";
$module_infoFile = "$moduleDir/VpnHoodConnect-android.json";
$module_packageFile = "$moduleDir/VpnHoodConnect-android.apk";
# PrepareModuleFolder $moduleDir $moduleDirLatest;
New-Item -ItemType Directory -Path $moduleDir -Force | Out-Null;
New-Item -ItemType Directory -Path $moduleDirLatest -Force | Out-Null;


# Calcualted Path
$module_infoFileName = $(Split-Path "$module_infoFile" -leaf);
$module_packageFileName = $(Split-Path "$module_packageFile" -leaf);

# publish info
$json = @{
	Version = $versionParam; 	
	UpdateInfoUrl = "https://github.com/vpnhood/Vpnhood.Client.Connect/releases/latest/download/$module_infoFileName";
	PackageUrl = "https://github.com/vpnhood/Vpnhood.Client.Connect/releases/latest/download/$module_packageFileName";
	InstallationPageUrl = "https://github.com/vpnhood/Vpnhood.Client.Connect/wiki/Get-VpnHood-CONNECT";
	GooglePlayUrl = "https://play.google.com/store/apps/details?id=com.vpnhood.connect.android";
	ReleaseDate = "$releaseDate";
	DeprecatedVersion = "$deprecatedVersion";
	NotificationDelay = "7.00:00:00";
};
$json | ConvertTo-Json | Out-File "$module_infoFile" -Encoding ASCII;

# move the apk
Move-Item -Path $apkFile -Destination $module_packageFile -Force; 
Copy-Item -path "$moduleDir/*" -Destination "$moduleDirLatest/" -Force -Recurse;

# Publishing to GitHub
Push-Location -Path "$solutionDir";

# apk
# Write-Host;
# Write-Host "*** Updating Android apk of GooglePlay to $versionTag ..." -BackgroundColor Blue -ForegroundColor White;
# $latestVersion = (gh release list -R "vpnhood/vpnhood" --limit 1 --exclude-drafts  --exclude-pre-releases | ForEach-Object { $_.Split()[0] });

Write-Output "Updating the Release ($versionTag) ...";
gh release upload $versionTag $module_infoFile $module_packageFile --clobber;

Pop-Location
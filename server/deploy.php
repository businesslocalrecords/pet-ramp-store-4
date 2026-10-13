<?php
/**
 * PawGrip deploy hook — Network Solutions / domain.com shared hosting.
 *
 * This file REPLACES a cron job. GitHub Actions calls it (over HTTP until
 * the subdomain has an SSL certificate) immediately after the publish
 * branch is updated; it pulls the built site from the public publish
 * branch and mirrors it into its own directory.
 *
 * Install once, by hand, via File Manager:
 *   1. In htdocs/pawgrip, create "New File" named deploy.php
 *   2. Paste these contents
 *   3. Replace the TOKEN placeholder with the shared secret that is also
 *      stored as this repo's DEPLOY_TOKEN secret (GitHub -> repo Settings
 *      -> Secrets and variables -> Actions). The URL to trigger a deploy
 *      is /deploy.php?token=THE-SAME-TOKEN
 *
 * House rules:
 *   - This copy in the repo carries the placeholder and is the reviewed
 *     source of truth; the server copy carries the real token and is never
 *     committed or transmitted as part of the site payload (deploys skip
 *     it via the mirror's exclude list).
 *   - It only ever writes inside its own directory.
 *   - Every deploy appends a line to deploy.log next to it; check that
 *     file first whenever a deploy misbehaves.
 */

const TOKEN       = 'REPLACE_WITH_THE_DEPLOY_TOKEN';
const VERSION_URL = 'https://raw.githubusercontent.com/businesslocalrecords/pet-ramp-store-4/publish/deploy-version.txt';
const TARBALL_URL = 'https://codeload.github.com/businesslocalrecords/pet-ramp-store-4/tar.gz/publish';

error_reporting(0);            // never leak server paths to the internet
set_time_limit(240);
header('Content-Type: text/plain');

$here = __DIR__;

/* --- auth ----------------------------------------------------------------- */
if (!isset($_GET['token']) || !hash_equals(TOKEN, $_GET['token'])) {
    http_response_code(403);
    exit('forbidden');
}

function fetch($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 120,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($ch);
        curl_close($ch);
        return $body === false ? null : $body;
    }
    if (ini_get('allow_url_fopen')) {
        $b = @file_get_contents($url);
        return $b === false ? null : $b;
    }
    return null;
}

function logline($here, $msg) {
    @file_put_contents($here . '/deploy.log', date('c') . ' ' . $msg . "\n", FILE_APPEND);
}

/* --- version gate: unchanged payload => do nothing ------------------------ */
$version     = fetch(VERSION_URL);
$versionFile = $here . '/.deploy-version';
if ($version !== null
    && is_file($versionFile)
    && trim($version) === trim((string) @file_get_contents($versionFile))) {
    logline($here, 'noop version=' . trim($version));
    exit('already up to date: ' . trim($version));
}

/* --- download ------------------------------------------------------------- */
$tarball = fetch(TARBALL_URL);
if ($tarball === null || strlen($tarball) < 10000) {
    logline($here, 'ERROR download failed');
    http_response_code(502);
    exit('download failed');
}

$tmp = $here . '/.deploy-tmp';          // inside the docroot: open_basedir-safe
if (function_exists('exec')) { exec('rm -rf ' . escapeshellarg($tmp)); }
@mkdir($tmp . '/src', 0777, true);
file_put_contents($tmp . '/build.tgz', $tarball);

/* --- extract: tar via exec, PharData as the fallback ---------------------- */
$ok = false;
if (function_exists('exec')) {
    exec('tar -xzf ' . escapeshellarg($tmp . '/build.tgz')
         . ' -C ' . escapeshellarg($tmp . '/src')
         . ' --strip-components=1 2>&1', $out, $code);
    $ok = ($code === 0 && is_file($tmp . '/src/index.html'));
}
if (!$ok && class_exists('PharData')) {
    try {
        (new PharData($tmp . '/build.tgz'))->extractTo($tmp . '/src', null, true);
        $ok = is_file($tmp . '/src/index.html');
    } catch (Exception $e) {
        $ok = false;
    }
}
if (!$ok) {
    logline($here, 'ERROR extract failed');
    if (function_exists('exec')) { exec('rm -rf ' . escapeshellarg($tmp)); }
    http_response_code(500);
    exit('extract failed');
}

/* --- mirror into place: rsync via exec, pure PHP as the fallback ---------- */
$ok = false;
if (function_exists('exec')) {
    exec('rsync -a --delete --exclude=deploy.php --exclude=.deploy-tmp '
         . escapeshellarg($tmp . '/src/') . ' ' . escapeshellarg($here . '/') . ' 2>&1',
         $out2, $code2);
    $ok = ($code2 === 0);
}
if (!$ok) {
    $ok = mirror($tmp . '/src', $here);
}
@unlink($here . '/deploy-version.txt');   // the marker stays server-side
if (function_exists('exec')) { exec('rm -rf ' . escapeshellarg($tmp)); }

if (!$ok) {
    logline($here, 'ERROR mirror failed');
    http_response_code(500);
    exit('mirror failed');
}
if ($version !== null) { file_put_contents($versionFile, trim($version) . "\n"); }
logline($here, 'deployed version=' . trim((string) $version));
echo 'deployed ' . trim((string) $version);

/* --- pure-PHP mirror (used only when exec/rsync are unavailable) ---------- */
function mirror($src, $dst) {
    $keep = ['deploy.php', 'deploy.log', '.deploy-version', '.deploy-tmp'];
    $made = [];
    $failed = false;

    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($it as $item) {
        $rel    = substr($item->getPathname(), strlen($src) + 1);
        $target = $dst . '/' . $rel;
        if ($item->isDir()) {
            if (!is_dir($target) && !@mkdir($target, 0755, true)) { $failed = true; }
        } else {
            if (!@copy($item->getPathname(), $target)) { $failed = true; }
        }
        $made[$target] = true;
    }

    // drop files in $dst that the payload no longer contains
    $it2 = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dst, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it2 as $item) {
        $path = $item->getPathname();
        if (in_array(basename($path), $keep, true)) { continue; }
        if (!isset($made[$path])) {
            $item->isDir() ? @rmdir($path) : @unlink($path);
        }
    }
    return !$failed;
}

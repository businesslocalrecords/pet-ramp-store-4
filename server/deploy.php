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

function rrmdir_php($dir) {                     // exec-free recursive delete
    if (!is_dir($dir)) { return; }
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $item) {
        $item->isDir() ? @rmdir($item->getPathname()) : @unlink($item->getPathname());
    }
    @rmdir($dir);
}

/**
 * Dependency-free tar.gz extractor: gzopen (zlib) plus manual tar header
 * parsing. Used when exec/tar and PharData are both unavailable, which is
 * the common case on locked-down shared hosting. Strips the tarball's
 * top-level directory (the same job as tar's --strip-components=1).
 */
function extract_tar_gz_php($tgzPath, $dest) {
    if (!function_exists('gzopen')) { return false; }
    $fh = gzopen($tgzPath, 'rb');
    if (!$fh) { return false; }
    $made = 0;
    while (!gzeof($fh)) {
        $header = gzread($fh, 512);
        if ($header === false || strlen($header) < 512) { break; }
        if ($header === str_repeat("\0", 512)) { break; }   // end marker
        $name = rtrim(substr($header, 0, 100), "\0");
        // ustar prefix field (long paths split across two fields)
        $magic = substr($header, 257, 6);
        if (substr($magic, 0, 5) === 'ustar') {
            $prefix = rtrim(substr($header, 345, 155), "\0");
            if ($prefix !== '') { $name = $prefix . '/' . $name; }
        }
        $sizeField = substr($header, 124, 12);
        if ($sizeField !== '' && ord($sizeField[0]) === 0x80) {  // GNU base-256 size
            gzclose($fh);
            return false;
        }
        $size     = octdec(trim($sizeField, " \0"));
        $typeflag = substr($header, 156, 1);

        // strip the leading top-level directory (strip-components=1)
        $name = ltrim($name, './');
        $slash = strpos($name, '/');
        if ($slash === false) { $name = ''; } else { $name = substr($name, $slash + 1); }

        $skipPayload = function ($size) use ($fh) {
            $blocks = (int) ceil($size / 512);
            for ($i = 0; $i < $blocks; $i++) { gzread($fh, 512); }
        };

        if ($name === '') {
            if ($size > 0) { $skipPayload($size); }
            continue;
        }
        $target = $dest . '/' . $name;
        if ($typeflag === '5') {                                  // directory
            if (!is_dir($target)) { @mkdir($target, 0755, true); }
            $made++;
        } elseif ($typeflag === '0' || $typeflag === ' ' || $typeflag === "\0" || $typeflag === '7') {
            $dir = dirname($target);
            if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
            $out = @fopen($target, 'wb');
            if (!$out) { gzclose($fh); return false; }
            $remaining = $size;
            while ($remaining > 0) {
                $data = gzread($fh, min($remaining, 65536));
                if ($data === false || $data === '') { break; }
                fwrite($out, $data);
                $remaining -= strlen($data);
            }
            fclose($out);
            if ($remaining > 0) { gzclose($fh); return false; }
            $pad = (512 - ($size % 512)) % 512;                   // tar pads to 512
            if ($pad > 0) { gzread($fh, $pad); }
            $made++;
        } else {                                                 // links/pax/other: skip
            if ($size > 0) { $skipPayload($size); }
        }
    }
    gzclose($fh);
    return $made > 0;
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
rrmdir_php($tmp);
@mkdir($tmp . '/src', 0777, true);
file_put_contents($tmp . '/build.tgz', $tarball);

/* --- extract: tar via exec, then PharData, then pure PHP ------------------ */
$ok    = false;
$how   = '';
if (function_exists('exec')) {
    exec('tar -xzf ' . escapeshellarg($tmp . '/build.tgz')
         . ' -C ' . escapeshellarg($tmp . '/src')
         . ' --strip-components=1 2>&1', $out, $code);
    $ok = ($code === 0 && is_file($tmp . '/src/index.html'));
    if ($ok) { $how = 'tar'; }
}
if (!$ok && class_exists('PharData')) {
    try {
        (new PharData($tmp . '/build.tgz'))->extractTo($tmp . '/src', null, true);
        $ok = is_file($tmp . '/src/index.html');
        if ($ok) { $how = 'phar'; }
    } catch (Exception $e) {
        $ok = false;
    }
}
if (!$ok) {
    $ok = extract_tar_gz_php($tmp . '/build.tgz', $tmp . '/src')
          && is_file($tmp . '/src/index.html');
    if ($ok) { $how = 'php'; }
}

if (!$ok) {
    logline($here, 'ERROR extract failed');
    http_response_code(500);
    // diagnostics: which extraction capabilities this host actually has
    echo "extract failed\n";
    echo 'php=' . PHP_VERSION . "\n";
    echo 'exec=' . (function_exists('exec') ? 'yes' : 'no')
       . ' shell_exec=' . (function_exists('shell_exec') ? 'yes' : 'no')
       . ' PharData=' . (class_exists('PharData') ? 'yes' : 'no')
       . ' gzopen=' . (function_exists('gzopen') ? 'yes' : 'no') . "\n";
    echo 'disable_functions=' . var_export(ini_get('disable_functions'), true) . "\n";
    echo 'open_basedir=' . var_export(ini_get('open_basedir'), true) . "\n";
    echo 'memory_limit=' . ini_get('memory_limit')
       . ' tarball_bytes=' . strlen($tarball)
       . ' writable_here=' . (is_writable($here) ? 'yes' : 'no')
       . ' writable_tmp=' . (is_writable($tmp) ? 'yes' : 'no') . "\n";
    if (function_exists('exec')) {
        exec('tar --version 2>&1', $tv, $tvc);
        echo 'tar_version=' . implode(' ', $tv) . " (code $tvc)\n";
        exec('ls -la ' . escapeshellarg($tmp . '/src') . ' 2>&1', $ls);
        echo 'src_listing=' . implode(' | ', (array) $ls) . "\n";
    }
    rrmdir_php($tmp);
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
rrmdir_php($tmp);

if (!$ok) {
    logline($here, 'ERROR mirror failed');
    http_response_code(500);
    exit('mirror failed');
}
if ($version !== null) { file_put_contents($versionFile, trim($version) . "\n"); }
logline($here, 'deployed version=' . trim((string) $version) . ' via ' . $how);
echo 'deployed ' . trim((string) $version) . ' via ' . $how;

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

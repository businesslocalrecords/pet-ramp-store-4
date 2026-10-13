<?php
/**
 * PawGrip click log — identical to the script running on the root domain
 * (businesslocalrecords.com/chicago). Appends one line per visit to
 * clicks.txt next to this file, in ET time, pipe-delimited:
 *
 *   2026-10-13 2:15:07 PM ET | chicago | 203.0.113.42 | /?utm_source=... | Mozilla/5.0 ... | via 10.0.0.1
 *
 * Called by the SPA on every page load (src/lib/click-tracker.ts POSTs the
 * path via navigator.sendBeacon). GET is refused on purpose (405), so a
 * bot hitting the URL directly cannot pollute the log.
 *
 * Deploy note: clicks.txt is server-side state. deploy.php excludes it from
 * the mirror's delete pass so tracked visits survive every deploy.
 *
 * Read-back note: this host answers 403 for .txt over HTTP (the file is
 * there - the SPA catch-all in .htaccess would otherwise have served
 * index.html for it). File Manager reads clicks.txt directly, and this
 * endpoint also serves it when called as /track.php?view=1&token=... with
 * the token from clicks-view-token.txt (a file the owner creates by hand,
 * once, next to this one; absent means the read path stays closed).
 */

if (isset($_GET["view"])) {
    // owner-only read path; the token file is hand-created and never in the
    // repo (never in the deployed payload either)
    $tokenFile = __DIR__ . "/clicks-view-token.txt";
    $expected = is_file($tokenFile) ? trim((string) @file_get_contents($tokenFile)) : "";
    if ($expected === "" || !isset($_GET["token"]) || !hash_equals($expected, (string) $_GET["token"])) {
        http_response_code(403);
        exit("forbidden");
    }
    header("Content-Type: text/plain; charset=utf-8");
    readfile(__DIR__ . "/clicks.txt");
    exit;
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    http_response_code(405);
    header("Allow: POST");
    exit;
}

function clean_field($value, $max)
{
    $value = str_replace(array("\r", "\n", "\t", "|"), " ", (string) $value);
    $value = preg_replace("/[^\x20-\x7E]/", "", $value);
    return substr(trim($value), 0, $max);
}

$path = clean_field($_POST["path"] ?? "", 200);
if ($path === "" || $path[0] !== "/" || strpos($path, "..") !== false || strpos($path, "://") !== false) {
    http_response_code(400);
    exit;
}

$city = "";
$query = parse_url($path, PHP_URL_QUERY);
if (is_string($query)) {
    parse_str($query, $fields);
    $named = strtolower((string) ($fields["city"] ?? ""));
    if (preg_match("/^[a-z0-9\-]+$/", $named)) {
        $city = $named;
    }
}
if ($city === "" && preg_match("#^/([a-z0-9\-]+)/#", $path, $match) && !in_array($match[1], array("prototype", "prototype2", "sales-archive"), true)) {
    $city = $match[1];
}

$ip = clean_field($_SERVER["REMOTE_ADDR"] ?? "", 45);
$forwarded = clean_field($_SERVER["HTTP_X_FORWARDED_FOR"] ?? "", 80);
$agent = clean_field($_SERVER["HTTP_USER_AGENT"] ?? "", 180);
$now = new DateTime("now", new DateTimeZone("America/New_York"));
$parts = array(
    $now->format("Y-m-d g:i A") . " ET",
    $city !== "" ? $city : "(unknown)",
    $ip !== "" ? $ip : "(no ip)",
    $path,
    $agent !== "" ? $agent : "(no agent)",
);
if ($forwarded !== "" && $forwarded !== $ip) {
    $parts[] = "via " . $forwarded;
}
$line = implode(" | ", $parts) . "\n";
if (@file_put_contents(__DIR__ . "/clicks.txt", $line, FILE_APPEND | LOCK_EX) === false) {
    http_response_code(500);
    exit;
}
http_response_code(204);

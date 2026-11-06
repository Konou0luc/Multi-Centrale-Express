<?php
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("Cache-Control: no-store");

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "error" => "method"]);
    exit;
}

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
if ($origin !== "" && !preg_match("#^https://(www\\.)?multicentraleexpress\\.com$#i", $origin)) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "origin"]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data) || !$data) {
    $data = $_POST;
}

if (!empty($data["_gotcha"])) {
    echo json_encode(["ok" => true]);
    exit;
}

$clean_line = static function ($value) {
    return trim(str_replace(["\r", "\n", "\0"], " ", (string) $value));
};

$subject = $clean_line($data["_subject"] ?? "Message — Multi Centrale Express");
if ($subject === "") {
    $subject = "Message — Multi Centrale Express";
}

$skip = ["_gotcha" => true, "_subject" => true, "_template" => true, "_captcha" => true, "_replyto" => true];
$lines = [];
$reply = "";

foreach ($data as $key => $value) {
    if (isset($skip[$key]) || is_array($value)) {
        continue;
    }
    $value = trim((string) $value);
    if ($value === "") {
        continue;
    }
    $label = $clean_line($key);
    if (strcasecmp($label, "Email") === 0 && filter_var($value, FILTER_VALIDATE_EMAIL)) {
        $reply = $value;
    }
    $lines[] = $label . " : " . str_replace(["\r\n", "\r"], "\n", $value);
}

if (!$lines) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "empty"]);
    exit;
}

$to = "info@multicentraleexpress.com";
$from = "info@multicentraleexpress.com";
$body = "Nouvelle demande depuis le site multicentraleexpress.com\n\n" . implode("\n", $lines) . "\n";
$encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";

$headers = [
    "From: Multi Centrale Express <{$from}>",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "X-Mailer: MultiCentraleExpress",
];
if ($reply !== "") {
    $headers[] = "Reply-To: {$reply}";
}

$sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers), "-f{$from}");

if (!$sent) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "mail"]);
    exit;
}

echo json_encode(["ok" => true]);

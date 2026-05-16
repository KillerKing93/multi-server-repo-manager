<?php
header('Content-Type: application/json');
echo json_encode([
    "service" => "PHP 8.2 Microservice",
    "status" => "Running",
    "time" => date('Y-m-d H:i:s')
]);

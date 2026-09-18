<?php
require_once __DIR__ . '/../config.php';
$check = mysqli_query($conn, "SELECT id FROM experiments WHERE code_name='blood_typing'");
if ($check && mysqli_num_rows($check) > 0) {
    echo "Already exists in database\n";
} else {
    $res = mysqli_query($conn, "INSERT INTO experiments (id, code_name, title, page_url, is_active, display_order) VALUES (13, 'blood_typing', 'تحديد فصائل الدم (ABO و Rh)', 'experiments/blood_typing.php', 1, 13) ON DUPLICATE KEY UPDATE title=VALUES(title), page_url=VALUES(page_url), is_active=VALUES(is_active)");
    if ($res) {
        echo "Successfully inserted/updated in live DB!\n";
    } else {
        echo "DB error: " . mysqli_error($conn) . "\n";
    }
}

<?php
// scratch/register_cell_division_exp.php
require_once __DIR__ . '/../config.php';

$code_name = 'cell_division';
$title = 'المجهر الافتراضي وانقسام الخلايا (وضع الشرح للمعلم)';
$page_url = 'experiments/cell_division.php';
$is_active = 1;

$sql = "INSERT INTO experiments (code_name, title, page_url, is_active)
        VALUES ('$code_name', '$title', '$page_url', $is_active)
        ON DUPLICATE KEY UPDATE title='$title', page_url='$page_url', is_active=1";

if (mysqli_query($conn, $sql)) {
    echo "SUCCESS: Experiment '$title' registered in database!\n";
} else {
    echo "ERROR: " . mysqli_error($conn) . "\n";
}
?>

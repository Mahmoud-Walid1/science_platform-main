<?php
// scratch/register_photosynthesis_exp.php
require_once __DIR__ . '/../config.php';

$code_name = 'photosynthesis_factors';
$title = 'العوامل المؤثرة على البناء الضوئي';
$page_url = 'experiments/photosynthesis_factors.php';
$category = 'biology';
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

<?php
// scratch/register_photosynthesis_elem.php
require_once __DIR__ . '/../config.php';

$code_name = 'photosynthesis_elementary';
$title = 'رحلة غذاء النبات ونموه';
$page_url = 'experiments/photosynthesis_elementary.php';
$category = 'biology';
$is_active = 1;

$sql = "INSERT INTO experiments (code_name, title, page_url, is_active)
        VALUES ('$code_name', '$title', '$page_url', $is_active)
        ON DUPLICATE KEY UPDATE title='$title', page_url='$page_url', is_active=1";

if (mysqli_query($conn, $sql)) {
    echo "SUCCESS: Experiment '$title' ($code_name) registered in database!\n";
} else {
    echo "ERROR: " . mysqli_error($conn) . "\n";
}

// Also ensure photosynthesis-elementary alias is supported
$sql_alias = "INSERT INTO experiments (code_name, title, page_url, is_active)
        VALUES ('photosynthesis-elementary', '$title', '$page_url', $is_active)
        ON DUPLICATE KEY UPDATE title='$title', page_url='$page_url', is_active=1";
mysqli_query($conn, $sql_alias);
?>

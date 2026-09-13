<?php
// scratch/register_gas_reaction_exp.php
require_once __DIR__ . '/../config.php';

$code_name = 'chemical_change';
$title = 'دلائل حدوث التغير الكيميائي (تكوّن غاز)';
$page_url = 'experiments/vinegar_balloon.php';
$is_active = 1;

$sql = "INSERT INTO experiments (code_name, title, page_url, is_active)
        VALUES ('$code_name', '$title', '$page_url', $is_active)
        ON DUPLICATE KEY UPDATE title='$title', page_url='$page_url', is_active=1";

if (mysqli_query($conn, $sql)) {
    echo "SUCCESS: Experiment '$title' registered in database!\n";
} else {
    echo "ERROR: " . mysqli_error($conn) . "\n";
}

// Also register alias 'gas_reaction' if needed
$sql_alias = "INSERT INTO experiments (code_name, title, page_url, is_active)
              VALUES ('gas_reaction', '$title', '$page_url', $is_active)
              ON DUPLICATE KEY UPDATE title='$title', page_url='$page_url', is_active=1";
mysqli_query($conn, $sql_alias);
?>

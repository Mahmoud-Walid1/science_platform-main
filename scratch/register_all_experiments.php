<?php
// scratch/register_all_experiments.php
require_once __DIR__ . '/../config.php';

header("Content-Type: text/html; charset=utf-8");

$experiments = [
    [
        'code_name' => 'photosynthesis',
        'title'     => 'تجربة البناء الضوئي التفاعلية',
        'page_url'  => 'experiments/photosynthesis.php',
        'is_active' => 1
    ],
    [
        'code_name' => 'photosynthesis_elementary',
        'title'     => 'رحلة نمو النبات 3D (البناء الضوئي)',
        'page_url'  => 'experiments/photosynthesis_elementary.php',
        'is_active' => 1
    ]
];

echo "<h2>🔧 سكربت تسجيل وتفعيل التجارب في قاعدة البيانات</h2>";

foreach ($experiments as $exp) {
    $code   = mysqli_real_escape_string($conn, $exp['code_name']);
    $title  = mysqli_real_escape_string($conn, $exp['title']);
    $page   = mysqli_real_escape_string($conn, $exp['page_url']);
    $active = (int)$exp['is_active'];

    $sql = "INSERT INTO experiments (code_name, title, page_url, is_active)
            VALUES ('$code', '$title', '$page', $active)
            ON DUPLICATE KEY UPDATE title='$title', page_url='$page', is_active=$active";
    
    if (mysqli_query($conn, $sql)) {
        echo "<p style='color:green; font-family:sans-serif; font-size:1.1rem;'>✅ تم بنجاح تفعيل وتسجيل: <strong>$title</strong> (الكود: <code>$code</code>)</p>";
    } else {
        echo "<p style='color:red; font-family:sans-serif; font-size:1.1rem;'>❌ خطأ: " . mysqli_error($conn) . "</p>";
    }
}

echo "<hr><p style='font-family:sans-serif;'><a href='../my-experiments.php' style='font-size:1.2rem; font-weight:bold; color:#004e66;'>👉 اضغط هنا للعودة إلى لوحة التجارب (my-experiments.php)</a></p>";
?>

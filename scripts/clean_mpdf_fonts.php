<?php

echo "Limpiando fuentes pesadas de mPDF para ahorrar espacio...\n";

$fontDir = __DIR__ . '/../vendor/mpdf/mpdf/ttfonts/';

// Lista de fuentes extremadamente pesadas que no se usan en español
$fontsToDelete = [
    'Sun-ExtA.ttf',
    'Sun-ExtB.ttf',
    'UnBatang_0613.ttf',
    'Aegyptus.otf',
    'Aegean.otf',
    'Akkadian.otf',
    'Quivira.otf',
    'Jomolhari.ttf',
    'Taigi.ttf',
    'Kinnari.ttf',
    'Kinnari-Bold.ttf',
    'Kinnari-BoldItalic.ttf',
    'Kinnari-Italic.ttf',
    'Garuda.ttf',
    'Garuda-Bold.ttf',
    'Garuda-BoldItalic.ttf',
    'Garuda-Italic.ttf',
    'FreeSerif.ttf',
    'FreeSerifBold.ttf',
    'FreeSerifBoldItalic.ttf',
    'FreeSerifItalic.ttf',
    'FreeSans.ttf',
    'FreeSansBold.ttf',
    'FreeSansBoldOblique.ttf',
    'FreeSansOblique.ttf'
];

$deletedCount = 0;
$freedSpace = 0;

foreach ($fontsToDelete as $font) {
    $path = $fontDir . $font;
    if (file_exists($path)) {
        $size = filesize($path);
        unlink($path);
        $freedSpace += $size;
        $deletedCount++;
    }
}

// Limpiar comodines (ej. fuentes árabes XB Riyaz)
foreach (glob($fontDir . 'XB Riyaz*.ttf') as $file) {
    if (is_file($file)) {
        $size = filesize($file);
        unlink($file);
        $freedSpace += $size;
        $deletedCount++;
    }
}

$freedMB = round($freedSpace / 1024 / 1024, 2);
echo "Se han eliminado {$deletedCount} fuentes innecesarias.\n";
echo "Espacio liberado: {$freedMB} MB.\n";

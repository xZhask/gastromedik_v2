<?php

namespace App\Services\Printers;

use App\Services\Exceptions\PrinterException;
use Mpdf\Mpdf;
use Mpdf\HTMLParserMode;

class PdfPrinter implements PrinterInterface
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;

        if (!$config['enabled']) {
            throw PrinterException::disabled();
        }

        // Crear carpeta temp si no existe
        if (!is_dir($config['temp_dir'])) {
            @mkdir($config['temp_dir'], 0777, true);
        }
    }

    /**
     * Imprime (descarga) PDF
     */
    public function print(string $content): void
    {
        try {
            $config = $this->config;
            $config['tempDir'] = $config['temp_dir'];
            unset($config['temp_dir']);

            $mpdf = new Mpdf($config);
            $mpdf->WriteHTML($this->getCss(), HTMLParserMode::HEADER_CSS);
            $mpdf->WriteHTML($content, HTMLParserMode::HTML_BODY);
            $mpdf->Output('Ticket.pdf', 'I');
            exit;
        } catch (\Exception $e) {
            throw PrinterException::printFailed($e->getMessage());
        }
    }

    /**
     * Retorna contenido HTML para preview
     */
    public function preview(string $content): string
    {
        return $content;
    }

    /**
     * Obtiene CSS para aplicar a PDFs
     */
    private function getCss(): string
    {
        $path = PUBLIC_PATH . '/assets/css/estilos.css';
        if (!is_file($path)) {
            return '';
        }
        return (string) file_get_contents($path);
    }

    public function getName(): string
    {
        return 'PDF Printer';
    }

    public function getType(): string
    {
        return $this->config['driver'];
    }
}

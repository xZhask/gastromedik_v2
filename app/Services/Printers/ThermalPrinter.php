<?php

namespace App\Services\Printers;

use App\Services\Exceptions\PrinterException;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

/**
 * Impresora térmica ESCPOS para Windows.
 *
 * Acepta un callable que recibe una instancia de Printer y escribe los
 * comandos ESCPOS directamente — sin eval(), sin generar código como string.
 *
 * Uso:
 *   $thermal = new ThermalPrinter($config);
 *   $thermal->printEscpos(function(Printer $p) {
 *       $p->text("Hola\n");
 *   });
 */
class ThermalPrinter implements PrinterInterface
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;

        if (!($config['enabled'] ?? true)) {
            throw PrinterException::disabled();
        }
    }

    /**
     * Imprime ejecutando un callable que recibe el objeto Printer.
     *
     * @param callable $builder  fn(Printer $printer): void
     * @throws PrinterException
     */
    public function printEscpos(callable $builder): void
    {
        try {
            $connector = new WindowsPrintConnector($this->config['name']);
            $printer   = new Printer($connector);

            try {
                $builder($printer);
                $printer->feed(3);
                $printer->cut();
                $printer->pulse();
            } finally {
                $printer->close();
            }
        } catch (PrinterException $e) {
            throw $e;
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'not found') || str_contains($e->getMessage(), 'No se pudo')) {
                throw PrinterException::connectionFailed($this->config['name']);
            }
            throw PrinterException::printFailed($e->getMessage());
        }
    }

    /**
     * Implementación de PrinterInterface::print() — delegada a printEscpos().
     * Acepta un callable serializado como string solo por compatibilidad de interfaz;
     * prefiere usar printEscpos() directamente.
     */
    public function print(string $content): void
    {
        // Mantiene compatibilidad con la interfaz; el flujo real usa printEscpos()
        throw PrinterException::printFailed(
            'Use ThermalPrinter::printEscpos(callable) en lugar de print(string).'
        );
    }

    /**
     * Genera un preview HTML minimal del ticket (sin impresora real).
     */
    public function preview(string $content): string
    {
        return '<div style="font-family:\'Courier New\',monospace;width:300px;padding:15px;background:#f9f9f9;border:1px solid #ddd;">'
             . nl2br(htmlspecialchars($content))
             . '</div>';
    }

    public function getName(): string
    {
        return $this->config['name'];
    }

    public function getType(): string
    {
        return $this->config['driver'] ?? 'escpos';
    }
}

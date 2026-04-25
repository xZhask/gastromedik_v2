<?php

namespace App\Core;

/**
 * Validador de datos de entrada.
 *
 * Uso:
 *   $v = Validator::make($_POST, [
 *       'nombre'  => 'required|min:2|max:100',
 *       'dni'     => 'required|numeric|length:8',
 *       'email'   => 'email',
 *       'cargo'   => 'required|in:1,2,4',
 *   ]);
 *
 *   if ($v->fails()) {
 *       Response::json(['errors' => $v->errors()], 422);
 *   }
 *
 *   $data = $v->validated();  // solo los campos validados
 *
 * Reglas disponibles:
 *   required          Campo obligatorio (no vacío)
 *   min:n             Longitud mínima (strings) o valor mínimo (números)
 *   max:n             Longitud máxima (strings) o valor máximo (números)
 *   length:n          Longitud exacta
 *   numeric           Solo números (enteros o decimales)
 *   integer           Solo enteros
 *   email             Formato de email válido
 *   in:a,b,c          El valor debe estar en la lista
 *   regex:/patrón/    El valor debe coincidir con la expresión regular
 *   date              Formato de fecha válido (Y-m-d)
 */
class Validator
{
    private array $data;
    private array $rules;
    private array $errors = [];

    private function __construct(array $data, array $rules)
    {
        $this->data  = $data;
        $this->rules = $rules;
        $this->validate();
    }

    public static function make(array $data, array $rules): self
    {
        return new self($data, $rules);
    }

    public function passes(): bool
    {
        return empty($this->errors);
    }

    public function fails(): bool
    {
        return !$this->passes();
    }

    /** Devuelve todos los errores como array asociativo [campo => [mensajes]] */
    public function errors(): array
    {
        return $this->errors;
    }

    /** Devuelve solo los campos que tienen reglas definidas */
    public function validated(): array
    {
        return array_intersect_key($this->data, $this->rules);
    }

    // ── Validación interna ───────────────────────────────────────────────────

    private function validate(): void
    {
        foreach ($this->rules as $field => $ruleString) {
            $value = $this->data[$field] ?? null;
            $rules = explode('|', $ruleString);

            foreach ($rules as $rule) {
                [$ruleName, $param] = array_pad(explode(':', $rule, 2), 2, null);

                // Si el campo no es required y está vacío, saltamos las demás reglas
                if ($ruleName !== 'required' && ($value === null || $value === '')) {
                    continue;
                }

                $error = $this->applyRule($field, $value, $ruleName, $param);
                if ($error !== null) {
                    $this->errors[$field][] = $error;
                }
            }
        }
    }

    private function applyRule(string $field, mixed $value, string $rule, ?string $param): ?string
    {
        return match ($rule) {
            'required' => ($value === null || $value === '')
                ? "El campo '{$field}' es obligatorio."
                : null,

            'min' => (is_numeric($value) ? (float)$value < (float)$param : strlen($value) < (int)$param)
                ? "El campo '{$field}' debe tener al menos {$param} caracteres."
                : null,

            'max' => (is_numeric($value) ? (float)$value > (float)$param : strlen($value) > (int)$param)
                ? "El campo '{$field}' no puede superar {$param} caracteres."
                : null,

            'length' => strlen((string)$value) !== (int)$param
                ? "El campo '{$field}' debe tener exactamente {$param} caracteres."
                : null,

            'numeric' => !is_numeric($value)
                ? "El campo '{$field}' debe ser un número."
                : null,

            'integer' => filter_var($value, FILTER_VALIDATE_INT) === false
                ? "El campo '{$field}' debe ser un número entero."
                : null,

            'email' => filter_var($value, FILTER_VALIDATE_EMAIL) === false
                ? "El campo '{$field}' debe ser un email válido."
                : null,

            'in' => !in_array((string)$value, explode(',', $param ?? ''), true)
                ? "El campo '{$field}' contiene un valor no permitido."
                : null,

            'regex' => !preg_match($param, (string)$value)
                ? "El campo '{$field}' tiene un formato inválido."
                : null,

            'date' => \DateTime::createFromFormat('Y-m-d', (string)$value) === false
                ? "El campo '{$field}' debe ser una fecha válida (YYYY-MM-DD)."
                : null,

            default => null,  // regla desconocida: ignorar silenciosamente
        };
    }
}

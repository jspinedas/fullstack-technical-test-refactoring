# Prompt de Automatización de Pruebas

<tarea>

Genera pruebas automatizadas para la solución refactorizada.

</tarea>

<alcance>

Crear pruebas para:

* TaxCalculator
* ProcessOrderUseCase

Utilizar mocks para:

* PaymentProvider
* OrderRepository

</alcance>

<escenarios_obligatorios>

Impuestos:

* España (21%)
* Estados Unidos (7%)
* País sin configuración (0%)

Flujo de negocio:

* Usuario existente.
* Usuario inexistente.
* Orden existente.
* Orden inexistente.
* Pago exitoso.
* Pago fallido.
* Actualización correcta de la orden.

</escenarios_obligatorios>

<restricciones>

* Utilizar Jest.
* No realizar llamadas HTTP reales.
* No utilizar base de datos real.
* No utilizar servicios externos.
* Las pruebas deben ser determinísticas.

</restricciones>

<resultado_esperado>

Entregar:

1. Estrategia de pruebas.
2. Estrategia de mocks.
3. Código completo de pruebas.
4. Explicación de cobertura.

</resultado_esperado>

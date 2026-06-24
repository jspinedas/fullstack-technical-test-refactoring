# Prompt de Refactorización

<tarea>

Analiza el archivo:

legacy/paymentService.ts

y refactorízalo utilizando principios de Clean Architecture.

</tarea>

<instrucciones>

Antes de generar código:

1. Identifica los problemas del código actual.
2. Explica los riesgos de mantenimiento y escalabilidad.
3. Propón una estructura de carpetas.
4. Explica brevemente las decisiones arquitectónicas.

Posteriormente genera la implementación completa.

</instrucciones>

<componentes_requeridos>

Crear:

* TaxCalculator
* PaymentProvider (interfaz)
* StripePaymentProvider (implementación)
* OrderRepository (interfaz)
* DatabaseOrderRepository (implementación)
* ProcessOrderUseCase

</componentes_requeridos>

<estructura_sugerida>

src/

* domain/
* application/
* infrastructure/
* services/

</estructura_sugerida>

<criterios_aceptacion>

* El comportamiento funcional debe mantenerse.
* El cálculo de impuestos debe estar aislado.
* La lógica de negocio no debe depender de Axios.
* La lógica de negocio no debe depender directamente de la base de datos.
* La solución debe ser fácilmente testeable.
* Debe aplicarse Dependency Inversion.

</criterios_aceptacion>

<formato_respuesta>

1. Problemas detectados.
2. Arquitectura propuesta.
3. Estructura de carpetas.
4. Implementación.

</formato_respuesta>

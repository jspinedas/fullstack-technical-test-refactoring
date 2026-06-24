# Contexto para Claude

<contexto>

Se requiere refactorizar una función legacy de procesamiento de pagos escrita en TypeScript.

El código actual se encuentra en:

legacy/paymentService.ts

La implementación actual mezcla múltiples responsabilidades:

* Acceso a base de datos
* Consulta de usuarios
* Consulta de órdenes
* Cálculo de impuestos
* Integración con proveedor de pagos
* Actualización de órdenes
* Manejo de errores
* Logging

Esto dificulta el mantenimiento, la escalabilidad y la creación de pruebas automatizadas.

</contexto>

<objetivo>

Transformar la implementación actual hacia una arquitectura limpia (Clean Architecture) separando responsabilidades y reduciendo el acoplamiento.

</objetivo>

<arquitectura_objetivo>

La solución debe separar responsabilidades en:

* TaxCalculator
* PaymentProvider
* OrderRepository
* ProcessOrderUseCase

La lógica de negocio debe depender de abstracciones y no de implementaciones concretas.

</arquitectura_objetivo>

<seguridad>

* No exponer información sensible en logs.
* Mantener consultas parametrizadas.
* Manejar errores de forma controlada.
* Evitar acoplar la lógica de negocio a servicios externos.

</seguridad>

<escalabilidad>

La arquitectura debe permitir:

* Agregar nuevos países e impuestos.
* Cambiar el proveedor de pagos.
* Cambiar la tecnología de persistencia.
* Agregar nuevas reglas sin modificar el caso de uso principal.

</escalabilidad>

<restricciones>

* No modificar el archivo legacy/paymentService.ts.
* Utilizar TypeScript.
* No utilizar any.
* No introducir frameworks adicionales.
* Mantener el comportamiento funcional existente.

</restricciones>

<entregables>

* Análisis del código legado.
* Arquitectura propuesta.
* Estructura de carpetas.
* Código refactorizado.
* Pruebas automatizadas.

</entregables>

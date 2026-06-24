# Refactorización de Servicio de Pagos — Clean Architecture

Refactorización de una función legacy de procesamiento de pagos en TypeScript hacia una arquitectura limpia (Clean Architecture), separando responsabilidades, eliminando acoplamiento directo y garantizando testeabilidad completa.

---

## Índice

1. [Descripción del proyecto](#1-descripción-del-proyecto)
2. [Problema original del código legacy](#2-problema-original-del-código-legacy)
3. [Arquitectura implementada](#3-arquitectura-implementada)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Responsabilidades de los componentes](#5-responsabilidades-de-los-componentes)
6. [Instalación](#6-instalación)
7. [Scripts disponibles](#7-scripts-disponibles)
8. [Ejecución local](#8-ejecución-local)
9. [Ejecución de pruebas](#9-ejecución-de-pruebas)
10. [Procedimiento de validación manual](#10-procedimiento-de-validación-manual)
11. [Decisiones técnicas](#11-decisiones-técnicas)
12. [Consideraciones de seguridad](#12-consideraciones-de-seguridad)
13. [Posibles mejoras futuras](#13-posibles-mejoras-futuras)

---

## 1. Descripción del proyecto

El proyecto toma una función legacy (`legacy/paymentService.ts`) que mezcla acceso a base de datos, cálculo de impuestos, integración con Stripe y actualización de órdenes en un único bloque, y la transforma en una solución estructurada bajo los principios de Clean Architecture.

**Stack:**

- TypeScript 5.3 con `strict: true`
- Jest 29 + ts-jest para pruebas unitarias
- Axios para llamadas HTTP al proveedor de pagos
- Sin frameworks adicionales (sin Express, NestJS, ni similares)

---

## 2. Problema original del código legacy

El archivo `legacy/paymentService.ts` presenta los siguientes problemas:

### Bugs

| Problema | Detalle |
|----------|---------|
| Función sin `async` | `processOrder` usa `await` pero no está declarada `async` — error de compilación |
| Retorno indefinido | Si el pago responde con status distinto de 200, la función retorna `undefined` en silencio |
| Errores de BD sin capturar | Las consultas `SELECT` iniciales no tienen `try/catch`; cualquier error de BD propaga sin control |
| URL de Stripe incorrecta | `'https://stripe.com'` no es un endpoint válido de la API de Stripe |

### Violaciones arquitectónicas

| Problema | Impacto |
|----------|---------|
| God Function | Una sola función hace: consulta de usuario, consulta de orden, cálculo de impuestos, cobro, actualización de BD y manejo de errores |
| Acoplamiento directo a `db` | Cambiar el ORM o motor de BD requiere modificar la lógica de negocio |
| Acoplamiento directo a `axios` | Cambiar el proveedor de pagos requiere modificar la lógica de negocio |
| Tasas de impuestos hardcodeadas | Agregar un nuevo país requiere modificar la función principal |
| `SELECT *` | Expone todas las columnas; acopla el código al esquema de la BD |
| Sin tipos | Los resultados de `db.query` son `any` implícito |

### Seguridad

| Problema | Detalle |
|----------|---------|
| Log con datos sensibles | `console.error('Error fatal', error)` puede exponer montos, `stripeId` y tokens en logs |
| Error genérico | `throw new Error('No existe')` no distingue si faltó el usuario o la orden |
| `UPDATE` con valor literal | `status = "paid"` hardcodeado en la query en lugar de parametrizado |

---

## 3. Arquitectura implementada

La solución aplica **Clean Architecture** con tres capas concéntricas. La dirección de dependencias siempre apunta hacia el dominio: la infraestructura depende de la aplicación, y la aplicación depende del dominio. Nunca al revés.

```
┌───────────────────────────────────────────────────────────┐
│                     Application Layer                     │
│                   ProcessOrderUseCase                     │
│               (orquesta sin hacer I/O directo)            │
├──────────────────┬─────────────────┬──────────────────────┤
│  ITaxCalculator  │ IPaymentProvider│  IOrderRepository    │  ← Interfaces (puertos)
│  ITaxCalculator  │ IUserRepository │                      │
├──────────────────┴─────────────────┴──────────────────────┤
│                      Domain Layer                         │
│          User, Order, errores de dominio tipados          │
├───────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                     │
│   StripePaymentProvider        DatabaseOrderRepository    │
│        (axios)                  DatabaseUserRepository    │
│                                    (legacy db)            │
└───────────────────────────────────────────────────────────┘
                            ▲
                     src/index.ts
                  (Composition Root)
          Instancia e inyecta todas las dependencias
```

**Principios aplicados:**

- **Single Responsibility**: cada clase tiene exactamente una razón para cambiar.
- **Open/Closed**: agregar un nuevo país o proveedor no requiere modificar código existente, solo añadir.
- **Dependency Inversion**: `ProcessOrderUseCase` depende únicamente de interfaces (`ITaxCalculator`, `IPaymentProvider`, `IOrderRepository`, `IUserRepository`), nunca de implementaciones concretas.

---

## 4. Estructura de carpetas

```
.
├── legacy/
│   ├── database.ts              # Stub del módulo de base de datos (reemplazar en producción)
│   └── paymentService.ts        # Código legado original — no modificado
│
├── src/
│   ├── domain/                  # Capa de dominio: entidades, interfaces y errores
│   │   ├── entities/
│   │   │   ├── Order.ts         # Interfaz Order y tipo OrderStatus
│   │   │   └── User.ts          # Interfaz User
│   │   ├── errors/
│   │   │   ├── OrderNotFoundError.ts
│   │   │   └── UserNotFoundError.ts
│   │   └── interfaces/
│   │       ├── IOrderRepository.ts
│   │       ├── IPaymentProvider.ts
│   │       ├── ITaxCalculator.ts
│   │       └── IUserRepository.ts
│   │
│   ├── application/             # Capa de aplicación: casos de uso y servicios de negocio
│   │   ├── services/
│   │   │   └── TaxCalculator.ts
│   │   └── usecases/
│   │       └── ProcessOrderUseCase.ts
│   │
│   ├── infrastructure/          # Capa de infraestructura: implementaciones concretas
│   │   ├── database/
│   │   │   ├── DatabaseAdapter.ts   # Adaptador entre el módulo legacy db e IDatabase
│   │   │   └── IDatabase.ts         # Interfaz genérica de consulta
│   │   ├── providers/
│   │   │   └── StripePaymentProvider.ts
│   │   └── repositories/
│   │       ├── DatabaseOrderRepository.ts
│   │       └── DatabaseUserRepository.ts
│   │
│   └── index.ts                 # Composition root: instancia y conecta todas las dependencias
│
├── tests/
│   └── unit/
│       ├── ProcessOrderUseCase.test.ts
│       └── TaxCalculator.test.ts
│
├── jest.config.js
├── package.json
├── tsconfig.json
└── tsconfig.test.json
```

---

## 5. Responsabilidades de los componentes

### TaxCalculator

**Archivo:** `src/application/services/TaxCalculator.ts`  
**Interfaz:** `ITaxCalculator` (`src/domain/interfaces/ITaxCalculator.ts`)

Calcula el impuesto aplicable a una orden en función del país del usuario. Es una función pura sin dependencias externas.

| País | Código | Tasa |
|------|--------|------|
| España | `ES` | 21% |
| Estados Unidos | `US` | 7% |
| Cualquier otro | — | 0% |

```typescript
// Agregar un nuevo país: editar únicamente TAX_RATES en TaxCalculator.ts
const TAX_RATES: Readonly<Record<string, number>> = {
  ES: 0.21,
  US: 0.07,
  // FR: 0.20,  ← basta con agregar aquí
};
```

### PaymentProvider

**Interfaz:** `IPaymentProvider` (`src/domain/interfaces/IPaymentProvider.ts`)  
**Implementación:** `StripePaymentProvider` (`src/infrastructure/providers/StripePaymentProvider.ts`)

Define el contrato de cobro al cliente. La lógica de negocio no conoce Axios ni Stripe; solo invoca `charge(request)` y recibe `{ success: boolean }`.

```typescript
export interface IPaymentProvider {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}
```

Para cambiar el proveedor de pagos (ej: Braintree, PayPal), basta con crear una nueva clase que implemente `IPaymentProvider` y cambiar la instanciación en `src/index.ts`.

### OrderRepository

**Interfaz:** `IOrderRepository` (`src/domain/interfaces/IOrderRepository.ts`)  
**Implementación:** `DatabaseOrderRepository` (`src/infrastructure/repositories/DatabaseOrderRepository.ts`)

Abstrae el acceso a la tabla `orders`. La lógica de negocio no conoce el driver de BD ni la sintaxis SQL.

```typescript
export interface IOrderRepository {
  findById(orderId: string): Promise<Order | null>;
  markAsPaid(orderId: string, tax: number): Promise<void>;
}
```

Para cambiar la tecnología de persistencia (ej: PostgreSQL, MongoDB, ORM), basta con crear una nueva implementación de `IOrderRepository`.

### ProcessOrderUseCase

**Archivo:** `src/application/usecases/ProcessOrderUseCase.ts`

Orquesta el flujo completo de procesamiento de una orden. No realiza ninguna operación de I/O directamente; delega todo en las interfaces inyectadas.

**Flujo:**

```
execute(orderId, userId)
  │
  ├─ userRepository.findById(userId)
  │    └─ null → lanza UserNotFoundError
  │
  ├─ orderRepository.findById(orderId)
  │    └─ null → lanza OrderNotFoundError
  │
  ├─ taxCalculator.calculate(user.country, order.total)
  │
  ├─ paymentProvider.charge({ amount, currency, customerId })
  │    ├─ lanza excepción → { success: false, error: 'Payment failed' }
  │    └─ success: false  → { success: false, error: 'Payment failed' }
  │
  ├─ orderRepository.markAsPaid(orderId, tax)
  │    └─ lanza excepción → propaga (el cobro fue exitoso; el caller puede reintentar solo la persistencia)
  │
  └─ { success: true }
```

---

## 6. Instalación

**Requisitos previos:** Node.js >= 18 y npm >= 9.

```bash
git clone <url-del-repositorio>
cd fullstack-technical-test-refactoring
npm install
```

---

## 7. Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `build` | `npm run build` | Compila TypeScript a `dist/` usando `tsconfig.json` |
| `typecheck` | `npm run typecheck` | Verifica tipos sin emitir archivos compilados |
| `test` | `npm test` | Ejecuta las pruebas unitarias con Jest |
| `test:coverage` | `npm run test:coverage` | Ejecuta las pruebas y genera reporte de cobertura |

---

## 8. Ejecución local

El proyecto es una librería/módulo, no una aplicación con servidor HTTP. El punto de entrada es `src/index.ts`, que actúa como **composition root**: instancia todas las dependencias y exporta `processOrderUseCase` listo para ser invocado.

```bash
# 1. Verificar que el código compila sin errores
npm run typecheck

# 2. Compilar a JavaScript
npm run build
# Los archivos compilados quedan en dist/
```

> **Nota:** `legacy/database.ts` contiene un stub que lanza un error si se invoca. En un entorno real, este módulo debe reemplazarse con la conexión real a la base de datos. El resto de la arquitectura (`src/`) no requiere cambios.

---

## 9. Ejecución de pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con reporte de cobertura
npm run test:coverage
```

**Resultado esperado:**

```
PASS tests/unit/TaxCalculator.test.ts
PASS tests/unit/ProcessOrderUseCase.test.ts

Test Suites: 2 passed, 2 total
Tests:       24 passed, 24 total

-------------------------|---------|----------|---------|---------|
File                     | % Stmts | % Branch | % Funcs | % Lines |
-------------------------|---------|----------|---------|---------|
 TaxCalculator.ts        |     100 |      100 |     100 |     100 |
 ProcessOrderUseCase.ts  |     100 |      100 |     100 |     100 |
 OrderNotFoundError.ts   |     100 |      100 |     100 |     100 |
 UserNotFoundError.ts    |     100 |      100 |     100 |     100 |
-------------------------|---------|----------|---------|---------|
```

**Cobertura de escenarios:**

| Escenario | Archivo de test |
|-----------|----------------|
| ES 21%, US 7%, país sin config 0% | `TaxCalculator.test.ts` |
| Total con decimales | `TaxCalculator.test.ts` |
| Total cero | `TaxCalculator.test.ts` |
| Usuario inexistente → `UserNotFoundError` | `ProcessOrderUseCase.test.ts` |
| Orden inexistente → `OrderNotFoundError` | `ProcessOrderUseCase.test.ts` |
| Pago exitoso → `{ success: true }` | `ProcessOrderUseCase.test.ts` |
| Pago exitoso → `markAsPaid` con args correctos | `ProcessOrderUseCase.test.ts` |
| Pago exitoso → monto cobrado = total + impuesto | `ProcessOrderUseCase.test.ts` |
| Pago fallido (`success: false`) → `{ success: false }` | `ProcessOrderUseCase.test.ts` |
| Proveedor lanza excepción → `{ success: false }` | `ProcessOrderUseCase.test.ts` |
| BD falla post-pago → error propagado | `ProcessOrderUseCase.test.ts` |
| Monto cobrado por país (ES, US, MX) | `ProcessOrderUseCase.test.ts` |

---

## 10. Procedimiento de validación manual

Dado que el proyecto no incluye servidor HTTP ni base de datos real, la validación manual se realiza verificando compilación, tipado y pruebas.

**Paso 1 — Instalar dependencias**

```bash
npm install
```

**Paso 2 — Verificar tipado estricto**

```bash
npm run typecheck
# Salida esperada: sin errores ni advertencias
```

**Paso 3 — Compilar el proyecto**

```bash
npm run build
# Los archivos .js quedan en dist/
# Verificar que dist/src/index.js existe
```

**Paso 4 — Ejecutar las pruebas**

```bash
npm test
# 24 tests deben pasar; 0 fallos
```

**Paso 5 — Verificar cobertura**

```bash
npm run test:coverage
# Cobertura esperada: 100% en statements, branches, functions y lines
# para TaxCalculator y ProcessOrderUseCase
```

**Paso 6 — Validar el comportamiento del cálculo de impuestos directamente**

El `TaxCalculator` puede invocarse de forma aislada. Verificar con los valores de los tests:

| Entrada | Resultado esperado |
|---------|--------------------|
| `calculate('ES', 100)` | `21` |
| `calculate('US', 100)` | `≈ 7` (precisión flotante en decimal 15) |
| `calculate('MX', 100)` | `0` |
| `calculate('ES', 0)` | `0` |

---

## 11. Decisiones técnicas

### Dependency Inversion en TaxCalculator

`ProcessOrderUseCase` depende de la interfaz `ITaxCalculator`, no de la clase `TaxCalculator`. Esto permite sustituir el cálculo de impuestos (ej: tasas progresivas, reglas fiscales por sector) sin modificar el caso de uso.

### Separación del scope del try/catch en el caso de uso

El bloque `try/catch` envuelve **únicamente** la llamada al proveedor de pagos. `markAsPaid` queda fuera intencionalmente: si la BD falla después de un cobro exitoso, el error debe propagarse para que el caller pueda reintentar la persistencia sin volver a cobrar al cliente.

### DatabaseAdapter como único punto de conversión de tipos

`DatabaseAdapter` es el único lugar del proyecto donde se hace una aserción de tipo (`result as T`). Todo el resto del código usa tipado explícito mediante interfaces de fila (`OrderRow`, `UserRow`). Esto aísla la "frontera sucia" con el módulo legacy en un único archivo.

### Errores de dominio tipados

Se usan `UserNotFoundError` y `OrderNotFoundError` (subclases de `Error`) en lugar de `throw new Error('No existe')`. Esto permite al caller distinguir el tipo de fallo sin inspeccionar el mensaje de texto.

### legacy/paymentService.ts no modificado

El archivo original se mantiene intacto como referencia. El compilador TypeScript lo excluye del build (está fuera del `include` de `tsconfig.json`) porque contiene errores intencionales del código legado.

### Tasas de impuesto como constante de módulo

`TAX_RATES` es un objeto `Readonly` en `TaxCalculator.ts`. Para agregar un nuevo país solo se añade una entrada; no se modifica ninguna lógica ni ningún otro archivo.

---

## 12. Consideraciones de seguridad

| Práctica | Implementación |
|----------|---------------|
| Sin datos sensibles en logs | El bloque `catch` del use case no registra el objeto de error; evita exponer montos, tokens o datos de cliente |
| Consultas totalmente parametrizadas | Todos los `db.query` usan `?` para todos los valores, incluido el `status = ?` en el `UPDATE` |
| Columnas explícitas en `SELECT` | Los repositorios seleccionan solo `id, total, status` / `id, country, stripeId`; no usan `SELECT *` |
| Errores descriptivos sin exposición de estado interno | Los mensajes de error indican qué entidad no se encontró, sin revelar detalles de la BD |
| Dependencias sin acceso externo en la lógica de negocio | `ProcessOrderUseCase` no importa `axios` ni el módulo `db`; solo trabaja con interfaces |

---

## 13. Posibles mejoras futuras

| Mejora | Descripción |
|--------|-------------|
| **Soporte multi-divisa** | `currency: 'usd'` está hardcodeado en el use case por equivalencia con el legacy. Debería derivarse del país del usuario o provenir del modelo `Order`. |
| **Método de repositorio más neutro** | `markAsPaid(orderId, tax)` podría generalizarse a `updateStatus(orderId, { status, tax })` para soportar otros estados (cancelación, reembolso) sin agregar nuevos métodos. |
| **Logging estructurado** | Agregar un puerto `ILogger` inyectable en el use case para registrar eventos (orden procesada, pago rechazado) sin acoplar a ninguna implementación de logging. |
| **Idempotencia post-pago** | Si `markAsPaid` falla tras un cobro exitoso, actualmente el error propaga. Un mecanismo de reintento idempotente (outbox pattern o idempotency key en Stripe) garantizaría consistencia eventual. |
| **Configuración de tasas en tiempo de ejecución** | `TAX_RATES` es una constante de compilación. Para entornos donde las tasas cambian frecuentemente, podría cargarse desde una fuente externa (base de datos, archivo de configuración). |
| **Validación de parámetros de entrada** | `execute(orderId, userId)` no valida strings vacíos ni formatos. Agregar validación en la frontera de entrada (capa de presentación o inicio del caso de uso) evitaría queries a la BD con valores inválidos. |

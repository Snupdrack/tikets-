# AsyncTicket - PRD (Product Requirements Document)

## Problema Original
Aplicación web privada (sin login) llamada "AsyncTicket" para generar tickets/recibos digitales profesionales con diseño oscuro tipo POS moderno. Permite crear tickets desde un formulario, generar vista HTML y PDF del ticket, guardar historial de tickets, y compartir manualmente por WhatsApp.

## Arquitectura

### Stack Tecnológico
- **Frontend**: React 19 + Shadcn UI + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Base de Datos**: MongoDB
- **PDF Generation**: WeasyPrint + Jinja2
- **QR Code**: qrcode library

### Estructura de Archivos
```
/app
├── backend/
│   ├── server.py          # API FastAPI con todos los endpoints
│   ├── templates/
│   │   └── ticket.html    # Template Jinja2 para tickets
│   └── storage/           # PDFs generados
├── frontend/src/
│   ├── pages/
│   │   ├── Dashboard.jsx  # Lista de tickets con filtros
│   │   ├── NewTicket.jsx  # Formulario crear ticket
│   │   ├── ViewTicket.jsx # Vista interna del ticket
│   │   └── PublicTicket.jsx # Vista pública compartible
│   └── lib/api.js         # Cliente API
```

## User Personas
1. **Pequeño Comerciante**: Necesita generar recibos rápidos para enviar a clientes por WhatsApp
2. **Emprendedor**: Quiere dar imagen profesional con tickets digitales bien diseñados

## Requerimientos Core (Implementados)

### Dashboard (/)
- [x] Estadísticas: Total tickets, tickets hoy, venta hoy, venta semana
- [x] Tabla de historial con: Recibo#, fecha, cliente, total, método de pago
- [x] Búsqueda por cliente/recibo
- [x] Filtros: Todos, Hoy, Semana, Mes
- [x] Acciones: Ver, Descargar PDF, Duplicar, Compartir WhatsApp

### Crear Ticket (/new)
- [x] Formulario con: Cliente, teléfono (opcional), empleado, TPV
- [x] Items dinámicos: nombre, cantidad, precio unitario
- [x] Cálculo automático de subtotal/total
- [x] Método de pago (Efectivo, Transferencia, Tarjeta, Depósito, Otro)
- [x] Descuento opcional
- [x] Notas opcionales
- [x] Botones: Guardar, Guardar y Ver

### Vista Ticket (/ticket/:id)
- [x] Diseño oscuro tipo POS con separadores decorativos
- [x] Total grande centrado
- [x] Badge de método de pago
- [x] Botones: Descargar PDF, Compartir WhatsApp, Copiar Link

### Vista Pública (/t/:publicId)
- [x] Ticket renderizado completo
- [x] QR Code apuntando a www.AsyncData.online
- [x] Botones de acción

### Backend API
- [x] POST /api/tickets - Crear ticket
- [x] GET /api/tickets - Listar con búsqueda y filtros
- [x] GET /api/tickets/:id - Obtener ticket
- [x] GET /api/tickets/:id/pdf - Generar/descargar PDF
- [x] POST /api/tickets/:id/duplicate - Duplicar
- [x] GET /api/stats - Estadísticas dashboard
- [x] GET /api/tickets/public/:publicId - Obtener por ID público

## Lo Implementado - 05/03/2026

### Backend
- API completa con FastAPI
- Modelos MongoDB: tickets con items embebidos
- Generación de PDF con WeasyPrint
- QR codes con librería qrcode
- Auto-incremento de número de recibo (1-0001, 1-0002...)
- Public ID seguro (secrets.token_urlsafe)

### Frontend
- Dashboard con estadísticas y tabla interactiva
- Formulario de creación con items dinámicos
- Vista de ticket estilo POS oscuro
- Dropdown de acciones
- Filtros y búsqueda funcionando

### Diseño
- Dark theme: #0f0f0f background, #eaeaea foreground
- Tipografía: Montserrat (headings), Inter (body), Space Mono (números)
- Separadores decorativos estilo recibo
- Efecto zigzag en parte inferior del ticket
- Animaciones sutiles y hover states

## Backlog Priorizado

### P0 (Crítico)
- Ninguno pendiente

### P1 (Importante)
- [ ] Eliminar tickets
- [ ] Editar tickets existentes
- [ ] Exportar historial a CSV/Excel

### P2 (Deseado)
- [ ] Logo personalizable en tickets
- [ ] Múltiples negocios/sucursales
- [ ] Reportes de ventas por período
- [ ] Gráficas de ventas
- [ ] Modo offline (PWA)

## Próximas Tareas
1. Agregar funcionalidad de eliminar tickets
2. Permitir editar tickets existentes
3. Exportar datos a CSV para contabilidad

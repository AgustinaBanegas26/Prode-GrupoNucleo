# Design Document: Admin Frontend Redesign Mundial 2026

## Overview

Rediseño completo del panel administrativo del Prode Mundialista 2026 con enfoque en diseño moderno tipo SaaS (Linear, Stripe, Notion, Vercel). El sistema incluye 9 pantallas principales con glassmorphism, dark mode nativo, y arquitectura mobile-first responsive. La solución implementa componentes reutilizables, integración con Supabase, y experiencia de usuario premium con animaciones fluidas y tablas interactivas con funcionalidades avanzadas (búsqueda, filtros, paginación, skeletons).

**Tech Stack:**
- React Native + Expo (SDK 56)
- TypeScript (strict mode)
- React Router (expo-router)
- Supabase (backend y real-time)
- React Query (@tanstack/react-query)
- Zustand (state management)
- Zod (validation)
- Expo Linear Gradient (glassmorphism)
- React Hook Form (forms)

**Design System:**
- Palette: #CC2627 (primary), dark/light themes
- Typography: Poppins (400, 500, 600, 700)
- Spacing: 8px scale (4, 8, 12, 16, 20, 24, 32, 40, 48)
- Border Radius: 6, 12, 16, 20, 24, 32, 9999
- Shadows: sm, md, lg, xl, glow, float
- Glassmorphism: rgba blur effects

## Architecture


```mermaid
graph TD
    A[App Entry] --> B[AdminLayout]
    B --> C[Sidebar Navigation]
    B --> D[Header Component]
    B --> E[Screen Container]
    
    E --> F1[Dashboard Screen]
    E --> F2[Partidos Screen]
    E --> F3[Predicciones Screen]
    E --> F4[Usuarios Screen]
    E --> F5[Ranking Screen]
    E --> F6[Premios Screen]
    E --> F7[Banner Screen]
    E --> F8[Estadísticas Screen]
    E --> F9[Configuración Screen]
    
    F1 --> G[Shared Components]
    F2 --> G
    F3 --> G
    F4 --> G
    F5 --> G
    F6 --> G
    F7 --> G
    F8 --> G
    F9 --> G
    
    G --> H1[DataTable]
    G --> H2[Modal]
    G --> H3[CountryFlag]
    G --> H4[StatCard]
    G --> H5[Chart]
    G --> H6[SearchBar]
    G --> H7[Pagination]
    G --> H8[Skeleton]
    
    I[Supabase] --> J[Real-time Subscriptions]
    I --> K[CRUD Operations]
    I --> L[File Storage]
    
    J --> F1
    K --> F2
    K --> F3
    K --> F4
    L --> F6
    L --> F7
```

## Sequence Diagrams

### User Flow: CRUD Operation (Create Match)


```mermaid
sequenceDiagram
    participant U as Admin User
    participant S as PartidosScreen
    participant M as Modal
    participant F as Form Handler
    participant V as Validator
    participant API as Supabase API
    participant DB as Database
    participant RT as Real-time
    
    U->>S: Click "Nuevo Partido"
    S->>M: Open Modal
    M->>U: Display Form
    
    U->>M: Fill Form Data
    U->>M: Click "Guardar"
    
    M->>F: Submit Form
    F->>V: Validate Data
    
    alt Validation Failed
        V-->>M: Return Errors
        M-->>U: Display Validation Errors
    else Validation Passed
        V-->>F: Data Valid
        F->>API: POST /matches
        API->>DB: INSERT match
        DB-->>API: Return match_id
        API-->>F: Success Response
        F->>RT: Trigger Real-time Event
        RT-->>S: Update Matches List
        F->>M: Close Modal
        M->>S: Show Success Toast
        S-->>U: Display Updated List
    end
```

### User Flow: Real-time Update


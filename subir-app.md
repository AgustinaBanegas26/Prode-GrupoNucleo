# 🚀 Cómo actualizar mi app con Expo (EAS)

Este proyecto usa **Expo EAS Build**, lo que permite actualizar la app de forma sencilla.

---

# 📱 Tipos de actualización

## 🟢 1. Cambios normales (recomendado)

Incluye:
- Cambios de diseño
- Nuevas pantallas
- Cambios en textos
- Cambios en lógica
- Integración con Supabase
- Corrección de errores

### 👉 Cómo actualizar:

```bash
git add .
git commit -m "update app"
git push

# 📲 Cómo instalar y cargar la app (clientes)

## 📥 1. Descargar la app

Cuando el administrador publique una nueva versión, recibirás un enlace tipo:

O un archivo `.apk` directamente.

---

## 📱 2. Instalar en Android

1. Abre el archivo APK descargado
2. Si Android lo bloquea:
   - Ir a **Configuración**
   - Activar **"Permitir instalar apps desconocidas"**
3. Instalar la app normalmente

---

## 🔄 3. Actualizaciones

La app puede actualizarse de dos formas:

### 🟢 Actualización automática (EAS Update)
- No necesitas descargar nada
- La app se actualiza sola al abrirla

### 🔵 Nueva versión (APK nuevo)
- Se envía un nuevo link de descarga
- Debes instalar encima de la versión anterior

---

## ⚠️ IMPORTANTE

- No desinstalar la app antes de actualizar
- Usar siempre el mismo dispositivo si es posible
- Mantener conexión a internet para sincronizar datos (Supabase)

---

## 🚀 Recomendación

Siempre descargar la última versión desde el link oficial del administrador para evitar errores o versiones antiguas.
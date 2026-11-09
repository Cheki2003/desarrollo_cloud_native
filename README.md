# Pedidos360 - Arquitectura Cloud Native

Este proyecto implementa la arquitectura base del sistema **Pedidos360**, demostrando una integración segura y escalable entre un frontend en **Angular 17**, un backend en **Spring Boot** alojado en **AWS EC2**, un proxy de entrada en **AWS API Gateway (HTTP API)** y gestión de identidades con **Amazon Cognito (IDaaS)**.

---
## links

http://localhost:4200/

http://34.195.89.36:8080/api/pedidos

https://qftpn0meq9.execute-api.us-east-1.amazonaws.com/api/pedidos


---
## comandos para levantar localmente

### Backend (Spring Boot)

```bash
cd pedidos360/pedidos360-backend
chmod +x mvnw
./mvnw spring-boot:run
```

La API queda disponible en: http://localhost:8080

### Frontend (Angular)

```bash
cd pedidos360/pedidos360-front/pedidos360-front
npm install
npm start -- --host 0.0.0.0 --port 4200
```

La app queda disponible en: http://localhost:4200

### Comandos EC2

```bash
nohup java -Dspring.security.oauth2.resourceserver.jwt.issuer-uri=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XqYEyzU4Y -jar app.jar > app.log 2>&1 &
tail -f app.log

sudo kill -9 $(sudo lsof -t -i:8080)
```

---

##  Arquitectura del Sistema

1. **Frontend (Angular 17 + AWS Amplify v6):** 
   * Maneja el flujo de autenticación mediante OIDC / OAuth 2.0 (Authorization Code Grant con PKCE).
   * Adjunta el token de acceso JWT (`Bearer`) a las peticiones mediante un `HttpInterceptorFn`.
2. **IDaaS (Amazon Cognito User Pool):**
   * Gestiona el registro e inicio de sesión de usuarios mediante Hosted UI.
   * Define Custom Scopes (`pedidos360-api/pedidos-api-read`) para autorización basada en roles.
3. **API Gateway (AWS HTTP API):**
   * Actúa como Reverse Proxy e intermediario entre el cliente web y la infraestructura privada.
   * Resuelve solicitudes Pre-flight mediante la ruta `OPTIONS /{proxy+}` con configuración estricta de CORS.
4. **Backend (Spring Boot en AWS EC2):**
   * Configurado como **OAuth2 Resource Server** (Defense in Depth).
   * Valida la firma criptográfica y el emisor (`issuer-uri`) del JWT directamente contra Cognito.

---

##  Mapeo de Puntos de Evaluación (Rúbrica)

| Componente | Configuración Implementada |
|---|---|
| **Rutas API Gateway** | `CRUD /api/pedidos` o sea GET, DELETE, PUT y POST integrando al backend EC2 en puerto 8080. |
| **CORS** | Configurado para permitir origen `http://localhost:4200` y cabeceras `Authorization`. |
| **Tenant IDaaS** | User Pool `us-east-1_XqYEyzU4Y` registrado en la región `us-east-1`. |
| **App Client** | Client ID `4go4kv0bh96di7cfcm9d3abhoo` habilitado con PKCE. |
| **Validación JWT** | Validación de token efectuada en la capa del Resource Server (Spring Security). |


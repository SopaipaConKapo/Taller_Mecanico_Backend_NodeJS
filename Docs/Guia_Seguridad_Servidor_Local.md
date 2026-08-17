# Guía de Seguridad y Precauciones para Servidor Local (VirtualBox)

Alojar un servidor de producción en tu propia computadora o red doméstica (Home Server) es sumamente eficiente y económico, pero conlleva responsabilidades críticas de seguridad. Esta guía detalla cómo mantener el servidor blindado y cómo resolver problemas comunes de accesibilidad.

---

## 1. Regla de Oro: Nunca abras los puertos de tu Router (Port Forwarding)

El error más común al hacer un "Home Server" es entrar a la configuración del router de la casa y abrir los puertos `80` (HTTP), `443` (HTTPS) o `5432` (PostgreSQL) apuntando a la IP de la computadora.
> [!CAUTION]
> **Peligro:** Si abres puertos en tu router, estás exponiendo tu red doméstica entera al internet público. Bots automatizados escanean IPs mundiales 24/7 buscando routers con puertos abiertos para inyectar Ransomware o robar datos.

### La Solución Segura: Cloudflare Tunnels (Zero Trust)
Tal como lo configuramos en el archivo `docker-compose.yml`, utilizaremos **Cloudflare Tunnels**.
- **¿Cómo funciona?** El contenedor `cloudflared` dentro de tu máquina virtual crea un túnel cifrado "hacia afuera" (outbound) conectándose a los servidores de Cloudflare. 
- **Ventaja:** Como la conexión se originó desde *adentro* de tu casa hacia afuera, el router la permite naturalmente. Cloudflare te asigna un dominio público (`tutaller.com`), recibe el tráfico de tus clientes, filtra los ataques DDoS, y lo envía por ese túnel seguro hacia tu computadora. ¡Nadie conoce tu verdadera dirección IP pública!

---

## 2. Hardening (Fortalecimiento) de la Máquina Virtual (Ubuntu Server)

Una vez que instales Linux (recomendado: Ubuntu Server 22.04 LTS o 24.04) en VirtualBox, debes aplicar estas capas de seguridad antes de arrancar el sistema.

### A. Firewall Interno (UFW)
Asegúrate de que la máquina virtual solo permita conexiones desde adentro.
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
# Permitir solo acceso por consola SSH (Puerto 22) para que tú la administres
sudo ufw allow 22/tcp
sudo ufw enable
```
*(No necesitas abrir puertos 3000 o 5432, ya que Docker se comunica internamente y Cloudflare se conecta directamente al contenedor de la aplicación).*

### B. Desactivar Login con Contraseña (SSH Keys)
Los ataques de fuerza bruta intentarán adivinar tu contraseña de administrador miles de veces por segundo.
1. Genera una llave SSH en tu máquina anfitriona (Windows/Mac).
2. Pega tu llave pública en `~/.ssh/authorized_keys` dentro del servidor Ubuntu.
3. Edita `/etc/ssh/sshd_config` y cambia `PasswordAuthentication yes` a `PasswordAuthentication no`.
4. Reinicia el servicio: `sudo systemctl restart ssh`.

### C. Fail2Ban
Es un software que lee los registros de tu servidor y bloquea automáticamente las direcciones IP que fallan al iniciar sesión demasiadas veces.
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 3. Resolución de Problemas (Troubleshooting) y Accesibilidad

¿Cómo garantizar que todo el mundo pueda acceder (Acceso a Todos) sin que se caiga el sistema?

### Problema 1: "Mi celular no puede conectarse al servidor"
- **Causa Posible:** VirtualBox está configurado en red **NAT** simple.
- **Solución:** En la configuración de VirtualBox, ve a **Red** y cambia el adaptador de "NAT" a **"Adaptador Puente" (Bridged Adapter)**. Esto hace que tu máquina virtual reciba una IP local real de tu router de Wi-Fi (ej. `192.168.1.50`), permitiendo que cualquier dispositivo conectado a tu Wi-Fi (como el celular de los mecánicos, si no usan internet móvil) pueda comunicarse directamente con ella.

### Problema 2: "Los servicios se caen cuando apago la computadora"
- **Causa Posible:** VirtualBox requiere que la aplicación gráfica esté abierta.
- **Solución:** Inicia la máquina virtual en modo "Headless" (Sin interfaz gráfica). Puedes configurar un servicio de Windows para que la máquina virtual de VirtualBox arranque sola, de forma invisible en el fondo, apenas prendas tu computadora.

### Problema 3: "El servidor Node/Prisma da error de Base de Datos"
- **Causa Posible:** Al reiniciar, el contenedor de Node.js arrancó más rápido que el contenedor de PostgreSQL.
- **Solución:** Ya está parcialmente mitigado con la propiedad `depends_on` en Docker, pero si falla, simplemente ejecuta:
  ```bash
  docker compose restart taller_api_gateway
  ```

### Problema 4: "El Webhook de MercadoPago no me llega"
- **Causa Posible:** El túnel de Cloudflare se desconectó o la variable `CLOUDFLARE_TUNNEL_TOKEN` se borró.
- **Solución:** Verifica que el token esté correctamente pegado en tu archivo `.env` y que el contenedor `cloudflared_tunnel` esté corriendo y diga "Registered tunnel connection" en sus logs:
  ```bash
  docker logs cloudflared_tunnel
  ```

# Guía Paso a Paso: Despliegue en Máquina Virtual (VirtualBox con Linux)

Si deseas convertir tu computadora en el servidor principal utilizando VirtualBox y Linux (Ubuntu Server), sigue exactamente estos pasos. Esto te permitirá tener un entorno idéntico a un servidor profesional en la nube (VPS) pero alojado en tu propia casa.

## Requisitos Previos

1.  **Descargar VirtualBox**: Instálalo en tu computadora Windows o Mac.
2.  **Descargar Ubuntu Server**: Descarga la imagen ISO gratuita desde la página oficial de Ubuntu (versión 22.04 LTS o 24.04 LTS).

---

## Paso 1: Configurar la Máquina Virtual en VirtualBox

1.  Abre VirtualBox y haz clic en **"Nueva"**. Asigna al menos 2 CPUs y 4GB de RAM (Recomendado para correr las 3 bases de datos y microservicios).
2.  Selecciona la imagen ISO de Ubuntu Server que descargaste.
3.  **CONFIGURACIÓN CRÍTICA DE RED:**
    *   Antes de iniciar la máquina, ve a **Configuración > Red**.
    *   Cambia "Conectado a:" de `NAT` a **`Adaptador Puente` (Bridged Adapter)**.
    *   *¿Por qué?* Esto hace que tu Máquina Virtual obtenga su propia IP local directamente de tu router Wi-Fi (ej. `192.168.1.50`), permitiendo que tu celular u otras computadoras en la misma red se conecten a ella.
4.  Inicia la máquina e instala Ubuntu Server siguiendo las instrucciones en pantalla. (Asegúrate de marcar la opción para instalar `OpenSSH server` durante la instalación).

---

## Paso 2: Instalar Docker en Ubuntu Server

Una vez que Ubuntu esté instalado y hayas iniciado sesión en la terminal negra de la máquina virtual, debes instalar Docker (el motor que correrá toda nuestra infraestructura).

Ejecuta los siguientes comandos uno por uno en la terminal de Ubuntu:

```bash
# 1. Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependencias para Docker
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# 3. Agregar la llave oficial de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. Agregar el repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Instalar Docker y Docker Compose
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# 6. Dar permisos a tu usuario para usar Docker sin escribir "sudo"
sudo usermod -aG docker $USER
```
> ⚠️ **Importante:** Después del último comando, debes cerrar sesión (`exit`) y volver a entrar a la máquina virtual para que los permisos se apliquen.

---

## Paso 3: Descargar el Código del Taller

En la terminal de Ubuntu, descarga este repositorio:

```bash
# Descargar git (si no viene instalado)
sudo apt install git -y

# Clonar el proyecto
git clone https://github.com/SopaipaConKapo/Taller_Mecanico_Backend_NodeJS.git

# Entrar a la carpeta del proyecto
cd Taller_Mecanico_Backend_NodeJS
```

---

## Paso 4: Configurar el Túnel de Cloudflare

Para que el servidor sea accesible desde internet de forma segura sin tocar tu router:

1.  Crea una cuenta gratuita en [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2.  Ve a **Networks > Tunnels** y crea un nuevo túnel.
3.  Cloudflare te dará un **Token** largo. Cópialo.
4.  En la terminal de tu máquina virtual, configura ese token como variable de entorno:

```bash
export CLOUDFLARE_TUNNEL_TOKEN="pega_tu_token_aqui_adentro"
```

---

## Paso 5: ¡Desplegar (Arrancar el Servidor)!

Una vez configurado el token, solo debes ejecutar el script automático que preparamos:

```bash
bash deploy_local.sh
```

**¿Qué hará este script?**
1.  Descargará las imágenes de PostgreSQL, RabbitMQ y Node.js.
2.  Levantará todas las bases de datos.
3.  Compilará los microservicios del Taller.
4.  Levantará el túnel de Cloudflare.

**¡Listo!** Si el script termina sin errores, tu backend está operando al 100% en tu propia máquina virtual y está expuesto al internet de manera segura a través de Cloudflare. Puedes revisar que todos los contenedores estén corriendo ejecutando:
```bash
docker ps
```

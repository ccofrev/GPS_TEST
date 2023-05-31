const net = require('net');

// Configuración del servidor TCP
const HOST = '0.0.0.0'; // Escucha en todas las interfaces de red
const PORT = 7070; // Puerto en el que se escucha
let codComando = 109;

// Expresiones regulares para detectar los tipos de paquetes
const regExLogin = /^##,imei:[^,]+,[^,]+;$/;
const regExHeartBeat = /^\d{15};$/;
const regExContenido = /^imei:(?:[^,]*,){18}[^;]*;$/;

// Crear un servidor TCP
const server = net.createServer(socket => {
  console.log('Cliente conectado');

  // Manejar los datos recibidos desde el cliente
  socket.on('data', data => {
    const gpsData = data.toString().trim();
    //console.log('Datos:', gpsData);

    if(regExContenido.test(gpsData)){
      // Analizar los datos de ubicación
      const location = parseLocationData(gpsData.slice(0, -1)); //se quita ;
      console.log('GPS Data:', location);

      // toggle relé con botón de pánico. Solo para pruebas, quitar luego
      if(location.keyword=='help me'){
        comando = `**,imei:${location.imei},${codComando}`;
        console.log("HELP ME! cambiando relé. Comando:", comando);
        socket.write(comando);
        codComando = (codComando == 109) ? 110 : 109;
      }

    }else if(regExHeartBeat.test(gpsData)){
      console.log("Heartbeat!")
      socket.write("ON");
    }else if(regExLogin.test(gpsData)){
      console.log("Login!")
      socket.write("LOAD");
    }

  });

  // Manejar la desconexión del cliente
  socket.on('end', () => {
    console.log('Cliente desconectado');
  });
});

// Función para analizar los datos de ubicación recibidos
function parseLocationData(data) {
  
  const parts = data.split(',');

  const imei = parts[0].split(':')[1];
  const keyword = parts[1];
  const time = parts[2];
  const cellNum = parts[3];
  const gpsState = parts[4];  // F/L F: gps valido L: no gps
  const latitude = coordConv(parts[7], parts[8]);
  const longitude = coordConv(parts[9], parts[10]);
  const speed = parts[11]!=''?parseFloat(parts[11]):0;
  const altitude = parts[13]!=''?parseFloat(parts[13]):0;
  const acc = parseInt(parts[14]);
  const door = parseInt(parts[15]);
  const oil1 = parts[16];
  const oil2 = parts[17];
  const temp = parts[18]!=''?parseFloat(parts[18]):0;

  const location = {
    imei,
    keyword,
    time,
    cellNum,
    gpsState,
    latitude,
    longitude,
    speed,
    altitude,
    acc,
    door,
    oil1,
    oil2,
    temp
  };

  return location;
}

// convierte formato <grado><minuto>.<decimalesMinuto>,<puntoCardinal>
// a coordenadas decimales con negativo para sur y oeste (formato google maps)
function coordConv(coord, pc){
  try{
    posPunto = coord.indexOf('.');
    if(posPunto<0)return 0
  }catch(error){
    return 0
  }
  gr = parseFloat(coord.slice(0,posPunto-2))
  mi = parseFloat(coord.slice(posPunto-2))
  let factor = 1
  if(pc == 'S' || pc == 'W')
    factor = -1
  return (gr + mi/60)*factor
}

// Iniciar el servidor y escuchar en el puerto especificado
server.listen(PORT, HOST, () => {
  console.log(`Servidor TCP escuchando en ${HOST}:${PORT}`);
});

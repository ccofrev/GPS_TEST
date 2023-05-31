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
    const locationData = data.toString().trim();
    //console.log('Datos:', locationData);

    if(regExLogin.test(locationData)){
      console.log("Login!")
      socket.write("LOAD");
    }else if(regExHeartBeat.test(locationData)){
      console.log("Heartbeat!")
      socket.write("ON");
    }else if(regExContenido.test(locationData)){
      // Analizar los datos de ubicación
      const location = parseLocationData(locationData);
      console.log('Ubicación:', location);
      if(location.motivo=='help me'){
        // comando = "**,imei:" + location.imei +"," + codComando;
        comando = `**,imei:${location.imei},${codComando}`;
        console.log("HELP ME! cambiando relé. Comando:", comando);
        socket.write(comando);
        codComando = (codComando == 109) ? 110 : 109;
      }
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
  const motivo = parts[1]
  const latitude = coordConv(parts[7], parts[8]);
  const longitude = coordConv(parts[9], parts[10]);
  const speed = parts[11]!=''?parseFloat(parts[11]):0.0;

  const location = {
    imei,
    motivo,
    latitude,
    longitude,
    speed
  };

  return location;
}

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
  if(pc == 'S' || pc == 's' || pc == 'W' || pc == 'w')
    factor = -1
  return (gr + mi/60)*factor
}

// Iniciar el servidor y escuchar en el puerto especificado
server.listen(PORT, HOST, () => {
  console.log(`Servidor TCP escuchando en ${HOST}:${PORT}`);
});

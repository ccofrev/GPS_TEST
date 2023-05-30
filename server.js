const net = require('net');

// Configuración del servidor TCP
const HOST = '0.0.0.0'; // Escucha en todas las interfaces de red
const PORT = 7070; // Puerto en el que se escucha

// Crear un servidor TCP
const server = net.createServer(socket => {
  console.log('Cliente conectado');

  // Manejar los datos recibidos desde el cliente
  socket.on('data', data => {
    const locationData = data.toString().trim();
    var cuentaComas = (locationData.match(/\,/g) || []).length;

    console.log('Datos:', locationData);

    if(cuentaComas<=2){
        if(cuentaComas==0){
            console.log("HEARTBEAT", locationData);
            socket.write("ON");
            socket.write("**,imei:864035051711308,100")
        }else{
            var spltd = locationData.split(',');
            if(spltd[0]=="##"){
                console.log("LOAD!");
                socket.write("LOAD");
                socket.write("**,imei:864035051711308,101,60s")
            }
        }
    }else if(cuentaComas==9){
        console.log("STATUS", locationData)
    }else{

        // Analizar los datos de ubicación
        const location = parseLocationData(locationData);
        console.log('Ubicación:', location);

        // Mostrar la ubicación en pantalla
        //displayLocation(location);
    }
  });

  // Manejar la desconexión del cliente
  socket.on('end', () => {
    console.log('Cliente desconectado');
  });
});

// Función para analizar los datos de ubicación recibidos
function parseLocationData(data) {
  // Supongamos que el formato de datos de ubicación de Coban es el siguiente:
  // IMEI,LATITUD,LONGITUD,VELOCIDAD,FIX
  const parts = data.split(',');

  const imei = parts[0];
  // const latitude = parseFloat(parts[7]+parts[8]+"");
  // const longitude = parseFloat(parts[9]+parts[10]+"");
  console.log("PARTS", parts)
  
  const latitude = coordConv(parts[7], parts[8]);
  const longitude = coordConv(parts[9],parts[10]);
  const speed = 0.0;
  const fix = 0.0;

  const location = {
    imei,
    latitude,
    longitude,
    speed,
    fix
  };

  return location;
}

function coordConv(coord, pc){
  posPunto = coord.indexOf('.')
  gr = parseFloat(coord.slice(0,posPunto-2))
  mi = parseFloat(coord.slice(posPunto-2))
  factor = 1
  if(pc == 'S' || pc == 's' || pc == 'W' || pc == 'w')
    factor = -1
  return (gr + mi/60)*factor
}

// Función para mostrar la ubicación en pantalla
function displayLocation(location) {
  console.log('IMEI:', location.imei);
  console.log('Latitud:', location.latitude);
  console.log('Longitud:', location.longitude);
  console.log('Velocidad:', location.speed);
  console.log('Fix:', location.fix);
  // Aquí puedes realizar cualquier acción adicional con los datos de ubicación,
  // como almacenarlos en una base de datos o enviar notificaciones, etc.
}

// Iniciar el servidor y escuchar en el puerto especificado
server.listen(PORT, HOST, () => {
  console.log(`Servidor TCP escuchando en ${HOST}:${PORT}`);
});

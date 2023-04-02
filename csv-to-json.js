const fs = require('fs');
const csvtojson = require('csvtojson');
const cliProgress = require('cli-progress');

const inputFile = 'C:/Users/feder/OneDrive/Escritorio/bot-whatsapp/db_bot_alices.csv'; // Nombre del archivo CSV de entrada
const outputBaseName = 'output'; // Nombre base del archivo JSON de salida (sin la extensión)
const maxFileSize = 10000000; // Tamaño máximo de cada archivo en bytes (en este ejemplo, 10 MB)

const campos = ['Curso', 'Nombres', 'Apellidos', 'Email', 'CodArea', 'Telefono', 'Dia', 'HoraDesde', 'Date'];

const regexCampo = {
  Curso: /Curso:\s*(.*)/,
  Nombres: /Nombres:\s*(.*)/,
  Apellidos: /Apellidos:\s*(.*)/,
  Email: /E-mail:\s*(.*)/,
  CodArea: /Cod Area:\s*(.*)/,
  Telefono: /Tel. Numero:\s*(.*)/,
  Dia: /Dia:\s*(.*)/,
  HoraDesde: /Hora Desde:\s*(.*)/,
  Date: /Date:\s*(.*)/
};

const alumnos = [];

// Función para parsear los valores de los campos
function parsearValor(valor, campo) {
  const match = valor.match(regexCampo[campo]);
  if (match && match.length > 1) {
    return match[1].trim();
  }
  return '';
}

// Crear una nueva barra de progreso
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_class);

// Leer el archivo CSV y convertirlo en un objeto JSON
csvtojson()
  .fromFile(inputFile)
  .subscribe((json) => {
    // Transformar el objeto JSON y agregarlo al array de alumnos
    const alumno = {};
    campos.forEach((campo) => {
      alumno[campo] = parsearValor(json[campo], campo);
    });
    alumnos.push(alumno);
    // Actualizar la barra de progreso
    progressBar.update(alumnos.length);
  }, null, () => {
    // Al finalizar la conversión, guardar el archivo JSON
    const jsonStr = JSON.stringify(alumnos, null, 2);
    fs.createWriteStream(`${outputBaseName}.json`, jsonStr, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('Archivo JSON generado correctamente!');
    });
    progressBar.stop();
  });

// Inicializar la barra de progreso con el número total de registros a procesar
csvtojson()
  .fromFile(inputFile)
  .then((jsonObj) => {
    progressBar.start(jsonObj.length, 0);
  })
  .catch((err) => {
    console.error(err);
  });